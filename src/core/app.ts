import { Router } from './router';
import { StateManager } from './state';
import { WebSocketClient } from '../api/websocket-client';
import { AuthPage } from '../components/auth/AuthPage';
import { MainPage } from '../components/main/MainPage';
import { AboutPage } from '../components/about/AboutPage';
import { WebSocketEvent, Message } from '../api/types';

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
      (login: string, password: string) => this.handleLogin(login, password),
      () => this.router.navigate('/about')
    );

    this.aboutPage = new AboutPage(() => {
      if (this.stateManager.getState().isAuthenticated) {
        this.router.navigate('/');
      } else {
        this.router.navigate('/login');
      }
    });

    this.setupRouter();
    this.setupWebSocket();
  }

  init(): void {
    this.router.start();
  }

  private setupRouter(): void {
    this.router.addRoute('/login', () => {
      const state = this.stateManager.getState();
      if (state.isAuthenticated) {
        this.router.navigate('/');
      } else {
        this.showAuthPage();
      }
    });

    this.router.addRoute('/', () => {
      const state = this.stateManager.getState();
      if (!state.isAuthenticated) {
        this.router.navigate('/login');
      } else {
        this.showMainPage();
      }
    });

    this.router.addRoute('/about', () => {
      this.showAboutPage();
    });

    this.router.addRoute('', () => {
      this.router.navigate('/login');
    });
  }

  private setupWebSocket(): void {
    const wsUrl = process.env.NODE_ENV === 'production'
      ? 'wss://fun-chat-server.onrender.com'
      : 'ws://localhost:4000';

    this.wsClient.connect(wsUrl);

    this.wsClient.onEvent(WebSocketEvent.CONNECTED, () => {
      console.log('WebSocket connected');
    });

    this.wsClient.onEvent(WebSocketEvent.DISCONNECTED, () => {
      console.log('WebSocket disconnected');
    });

    this.wsClient.onEvent(WebSocketEvent.ERROR, (error) => {
      console.error('WebSocket error:', error);
    });

    this.wsClient.onEvent(WebSocketEvent.USER_LOGIN, (data: any) => {
      if (data?.user?.isLogined) {
        this.stateManager.setCurrentUser(data.user.login);
        this.stateManager.setAuthenticated(true);
        this.requestActiveUsers();
        this.router.navigate('/');
      }
    });

    this.wsClient.onEvent(WebSocketEvent.ERROR_RESPONSE, (data: any) => {
      if (this.currentPage === this.authPage.render()) {
        this.authPage.showError(data?.error || 'Unknown error');
      }
    });

    this.wsClient.onEvent(WebSocketEvent.USER_EXTERNAL_LOGIN, (data: any) => {
      if (data?.user?.login) {
        this.updateUserStatus(data.user.login, true);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.USER_EXTERNAL_LOGOUT, (data: any) => {
      if (data?.user?.login) {
        this.updateUserStatus(data.user.login, false);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.USER_ACTIVE, (data: any) => {
      if (data?.users) {
        this.stateManager.setUsers(data.users);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.MSG_SEND, (data: any) => {
      if (data?.message) {
        this.handleIncomingMessage(data.message);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.MSG_DELIVER, (data: any) => {
      if (data?.message?.id) {
        this.stateManager.updateMessageStatus(data.message.id, true, false);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.MSG_READ, (data: any) => {
      if (data?.message?.id) {
        this.stateManager.updateMessageStatus(data.message.id, true, true);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.MSG_EDIT, (data: any) => {
      if (data?.message?.id && data?.message?.text) {
        this.stateManager.updateMessageText(data.message.id, data.message.text);
      }
    });

    this.wsClient.onEvent(WebSocketEvent.MSG_DELETE, (data: any) => {
      if (data?.message?.id) {
        this.stateManager.deleteMessage(data.message.id);
      }
    });
  }

  private showAuthPage(): void {
    this.currentPage = this.authPage.render();
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(this.currentPage);
  }

  private showMainPage(): void {
    const state = this.stateManager.getState();

    if (!this.mainPage) {
      this.mainPage = new MainPage(
        state.currentUser!,
        () => this.handleLogout(),
        () => this.router.navigate('/about'),
        (to: string, text: string) => this.sendMessage(to, text),
        (messageId: string) => this.deleteMessage(messageId),
        (messageId: string, newText: string) => this.editMessage(messageId, newText),
        (messageId: string) => this.markAsRead(messageId),
        (userLogin: string) => this.requestMessages(userLogin),
        this.stateManager
      );
    } else {
      this.mainPage.updateUserName(state.currentUser!);
    }

    this.currentPage = this.mainPage.render();
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(this.currentPage);
  }

  private showAboutPage(): void {
    this.currentPage = this.aboutPage.render();
    this.appContainer.innerHTML = '';
    this.appContainer.appendChild(this.currentPage);
  }

  private handleLogin(login: string, password: string): void {
    setTimeout(() => {
      const requestId = this.generateRequestId();
      this.wsClient.sendRequest({
        id: requestId,
        type: WebSocketEvent.USER_LOGIN,
        payload: { user: { login, password } }
      });
    }, 1500);
  }

  private handleLogout(): void {
    const state = this.stateManager.getState();
    const requestId = this.generateRequestId();

    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.USER_LOGOUT,
      payload: { user: { login: state.currentUser! } }
    });

    this.stateManager.setAuthenticated(false);
    this.stateManager.setCurrentUser(null);
    this.mainPage = null;
    this.router.navigate('/login');
  }

  private requestActiveUsers(): void {
    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.USER_ACTIVE,
      payload: null
    });
  }

  private sendMessage(to: string, text: string): void {
    if (!text.trim()) return;

    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.MSG_SEND,
      payload: { message: { to, text } }
    });
  }

  private deleteMessage(messageId: string): void {
    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.MSG_DELETE,
      payload: { message: { id: messageId } }
    });
  }

  private editMessage(messageId: string, newText: string): void {
    if (!newText.trim()) return;

    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.MSG_EDIT,
      payload: { message: { id: messageId, text: newText } }
    });
  }

  private markAsRead(messageId: string): void {
    const requestId = this.generateRequestId();
    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.MSG_READ,
      payload: { message: { id: messageId } }
    });
  }

  private requestMessages(userLogin: string): void {
    const requestId = this.generateRequestId();

    this.wsClient.onMessage(requestId, (response: any) => {
      if (response.type === WebSocketEvent.MSG_FROM_USER && response.payload?.messages) {
        this.stateManager.setMessages(response.payload.messages);
      }
    });

    this.wsClient.sendRequest({
      id: requestId,
      type: WebSocketEvent.MSG_FROM_USER,
      payload: { user: { login: userLogin } }
    });

    const countRequestId = this.generateRequestId();

    this.wsClient.onMessage(countRequestId, (response: any) => {
      if (response.type === WebSocketEvent.MSG_COUNT_NOT_READED_FROM_USER && response.payload?.count !== undefined) {
        this.stateManager.setUnreadCount(userLogin, response.payload.count);
      }
    });

    this.wsClient.sendRequest({
      id: countRequestId,
      type: WebSocketEvent.MSG_COUNT_NOT_READED_FROM_USER,
      payload: { user: { login: userLogin } }
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