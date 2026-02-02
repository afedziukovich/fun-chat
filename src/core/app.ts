import { Router } from './router';
import { StateManager } from './state';
import { WebSocketClient } from '../api/websocket-client';
import { AuthPage } from '../components/auth/AuthPage';
import { MainPage } from '../components/main/MainPage';
import { AboutPage } from '../components/about/AboutPage';
import { User, Message, ServerResponse } from '../api/types';

export class App {
  private router: Router;
  private stateManager: StateManager;
  private wsClient: WebSocketClient;
  private appContainer: HTMLElement;
  private currentPage: HTMLElement | null = null;

  private authPage: AuthPage;
  private mainPage: MainPage | null = null;
  private aboutPage: AboutPage;

  private messageCounter = 0;

  constructor() {
    this.appContainer = document.getElementById('app')!;
    this.router = new Router();
    this.stateManager = new StateManager();
    this.wsClient = new WebSocketClient();

    this.authPage = new AuthPage(
      (login, password) => this.handleLogin(login, password),
      () => this.router.navigate('/about')
    );

    this.aboutPage = new AboutPage(() => {
      if (this.stateManager.getState().isAuthenticated) {
        this.router.navigate('/main');
      } else {
        this.router.navigate('/');
      }
    });

    this.setupRouter();
    this.setupWebSocket();
  }

  init(): void {
    this.router.start();
  }

  private setupRouter(): void {
    this.router.addRoute('/', () => {
      const state = this.stateManager.getState();
      if (state.isAuthenticated) {
        this.router.navigate('/main');
      } else {
        this.showAuthPage();
      }
    });

    this.router.addRoute('/main', () => {
      const state = this.stateManager.getState();
      if (!state.isAuthenticated) {
        this.router.navigate('/');
      } else {
        this.showMainPage();
      }
    });

    this.router.addRoute('/about', () => {
      this.showAboutPage();
    });
  }

  private setupWebSocket(): void {
    const wsUrl = process.env.NODE_ENV === 'production' ? 'wss://fun-chat-server.onrender.com' : 'ws://localhost:4000';

    this.wsClient.connect(wsUrl);

    this.wsClient.onEvent('connected', () => {
      console.log('WebSocket: Connected to server');
    });

    this.wsClient.onEvent('disconnected', () => {
      console.log('WebSocket: Disconnected from server');
    });

    this.wsClient.onEvent('error', (error) => {
      console.error('WebSocket error:', error);
    });

    this.wsClient.onEvent('USER_LOGIN', (data: any) => {
      console.log('WebSocket: USER_LOGIN received');
      const response = data as { user: User };
      if (response.user.isLogined) {
        console.log('Login successful, navigating to /main');
        this.stateManager.setCurrentUser(response.user.login);
        this.stateManager.setAuthenticated(true);
        this.requestActiveUsers();
        this.router.navigate('/main');
      }
    });

    this.wsClient.onEvent('ERROR', (data: any) => {
      const error = data as { error: string };
      if (this.currentPage === this.authPage.render()) {
        this.authPage.showError(error.error);
      }
    });

    this.wsClient.onEvent('USER_EXTERNAL_LOGIN', (data: any) => {
      const response = data as { user: User };
      this.updateUserStatus(response.user.login, true);
    });

    this.wsClient.onEvent('USER_EXTERNAL_LOGOUT', (data: any) => {
      const response = data as { user: User };
      this.updateUserStatus(response.user.login, false);
    });

    this.wsClient.onEvent('USER_ACTIVE', (data: any) => {
      const response = data as { users: User[] };
      this.stateManager.setUsers(response.users);
    });

    this.wsClient.onEvent('MSG_SEND', (data: any) => {
      const response = data as { message: Message };
      this.handleIncomingMessage(response.message);
    });

    this.wsClient.onEvent('MSG_DELIVER', (data: any) => {
      const response = data as { message: { id: string, status: { isDelivered: boolean } } };
      this.stateManager.updateMessageStatus(response.message.id, true, false);
    });

    this.wsClient.onEvent('MSG_READ', (data: any) => {
      const response = data as { message: { id: string, status: { isReaded: boolean } } };
      this.stateManager.updateMessageStatus(response.message.id, true, true);
    });

    this.wsClient.onEvent('MSG_EDIT', (data: any) => {
      const response = data as { message: { id: string, text: string, status: { isEdited: boolean } } };
      this.stateManager.updateMessageText(response.message.id, response.message.text);
    });

    this.wsClient.onEvent('MSG_DELETE', (data: any) => {
      const response = data as { message: { id: string, status: { isDeleted: boolean } } };
      this.stateManager.deleteMessage(response.message.id);
    });
  }

  private showAuthPage(): void {
    console.log('Showing auth page');
    this.currentPage = this.authPage.render();
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(this.currentPage);
  }

  private showMainPage(): void {
    console.log('Showing main page');
    const state = this.stateManager.getState();

    if (!this.mainPage) {
      console.log('Creating new MainPage');
      this.mainPage = new MainPage(
        state.currentUser!,
        () => this.handleLogout(),
        () => this.router.navigate('/about'),
        (to, text) => this.sendMessage(to, text),
        (messageId) => this.deleteMessage(messageId),
        (messageId, newText) => this.editMessage(messageId, newText),
        (messageId) => this.markAsRead(messageId),
        (userLogin) => this.requestMessages(userLogin),
        this.stateManager
      );
    } else {
      console.log('Updating existing MainPage');
      this.mainPage.updateUserName(state.currentUser!);
    }

    this.currentPage = this.mainPage.render();
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(this.currentPage);
  }

  private showAboutPage(): void {
    console.log('Showing about page');
    this.currentPage = this.aboutPage.render();
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(this.currentPage);
  }

  private handleLogin(login: string, password: string): void {
    const requestId = this.generateRequestId();

    this.wsClient.onMessage(requestId, (response: ServerResponse) => {
      if (response.type === 'ERROR') {
        this.authPage.showError((response.payload as any).error);
      }
    });

    this.wsClient.sendRequest({
      id: requestId,
      type: 'USER_LOGIN',
      payload: {
        user: { login, password }
      }
    });
  }

  private handleLogout(): void {
    const state = this.stateManager.getState();
    const requestId = this.generateRequestId();

    this.wsClient.sendRequest({
      id: requestId,
      type: 'USER_LOGOUT',
      payload: {
        user: { login: state.currentUser!, password: '' }
      }
    });

    this.stateManager.setAuthenticated(false);
    this.stateManager.setCurrentUser(null);
    this.mainPage = null;
    this.router.navigate('/');
  }

  private requestActiveUsers(): void {
    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: 'USER_ACTIVE',
      payload: null
    });
  }

  private sendMessage(to: string, text: string): void {
    if (!text.trim()) return;

    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: 'MSG_SEND',
      payload: {
        message: { to, text }
      }
    });
  }

  private deleteMessage(messageId: string): void {
    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: 'MSG_DELETE',
      payload: {
        message: { id: messageId }
      }
    });
  }

  private editMessage(messageId: string, newText: string): void {
    if (!newText.trim()) return;

    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: 'MSG_EDIT',
      payload: {
        message: { id: messageId, text: newText }
      }
    });
  }

  private markAsRead(messageId: string): void {
    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: 'MSG_READ',
      payload: {
        message: { id: messageId }
      }
    });
  }

  private requestMessages(userLogin: string): void {
    const requestId = this.generateRequestId();

    this.wsClient.onMessage(requestId, (response: ServerResponse) => {
      if (response.type === 'MSG_FROM_USER') {
        const messages = (response.payload as any).messages as Message[];
        this.stateManager.setMessages(messages);
      }
    });

    this.wsClient.sendRequest({
      id: requestId,
      type: 'MSG_FROM_USER',
      payload: {
        user: { login: userLogin }
      }
    });

    const countRequestId = this.generateRequestId();

    this.wsClient.onMessage(countRequestId, (response: ServerResponse) => {
      if (response.type === 'MSG_COUNT_NOT_READED_FROM_USER') {
        const count = (response.payload as any).count as number;
        this.stateManager.setUnreadCount(userLogin, count);
      }
    });

    this.wsClient.sendRequest({
      id: countRequestId,
      type: 'MSG_COUNT_NOT_READED_FROM_USER',
      payload: {
        user: { login: userLogin }
      }
    });
  }

  private handleIncomingMessage(message: Message): void {
    this.stateManager.addMessage(message);
  }

  private updateUserStatus(userLogin: string, isOnline: boolean): void {
    const state = this.stateManager.getState();
    const users = state.users.map(user =>
      user.login === userLogin ? { ...user, isLogined: isOnline } : user
    );
    this.stateManager.setUsers(users);
  }

  private generateRequestId(): string {
    this.messageCounter++;
    return `req_${Date.now()}_${this.messageCounter}`;
  }
}