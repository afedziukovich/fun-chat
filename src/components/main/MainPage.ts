import { Header } from './Header';
import { Footer } from './Footer';
import { UserList } from './UserList';
import { ChatDialog } from './ChatDialog';
import { User, Message } from '../../api/types';
import { StateManager } from '../../core/state';

export class MainPage {
  private element: HTMLElement;
  private header: Header;
  private footer: Footer;
  private userList: UserList;
  private chatDialog: ChatDialog;
  private selectedUser: string = '';
  private stateManager: StateManager;
  private unsubscribe: (() => void) | null = null;

  constructor(
    userName: string,
    logoutCallback: () => void,
    showAboutCallback: () => void,
    sendMessageCallback: (to: string, text: string) => void,
    deleteMessageCallback: (messageId: string) => void,
    editMessageCallback: (messageId: string, newText: string) => void,
    markAsReadCallback: (messageId: string) => void,
    requestMessagesCallback: (userLogin: string) => void,
    stateManager: StateManager
  ) {
    this.element = document.createElement('div');
    this.element.className = 'main-page';

    this.stateManager = stateManager;

    this.header = new Header(userName, logoutCallback, showAboutCallback);
    this.footer = new Footer();
    this.userList = new UserList();
    this.chatDialog = new ChatDialog(
      (text) => {
        if (this.selectedUser) {
          sendMessageCallback(this.selectedUser, text);
        }
      },
      deleteMessageCallback,
      editMessageCallback,
      markAsReadCallback
    );

    this.chatDialog.setCurrentUser(userName);
    this.userList.setUserClickCallback((userLogin) => {
      this.selectedUser = userLogin;
      this.chatDialog.setSelectedUser(userLogin, true);
      requestMessagesCallback(userLogin);
    });

    this.subscribeToState();
  }

  private subscribeToState(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = this.stateManager.subscribe((state) => {
      if (state.users) {
        this.setUsers(state.users);
      }

      if (state.userStatuses) {
        Object.entries(state.userStatuses).forEach(([userLogin, status]) => {
          this.updateUserStatus(userLogin, (status as any).isOnline);
        });
      }

      if (this.selectedUser && state.messages && state.messages[this.selectedUser]) {
        this.setMessages(state.messages[this.selectedUser]);
      }

      if (state.unreadCounts) {
        Object.entries(state.unreadCounts).forEach(([userLogin, count]) => {
          this.setUnreadCount(userLogin, count as number);
        });
      }
    });
  }

  render(): HTMLElement {
    this.element.innerHTML = '';

    const headerElement = this.header.render();
    this.element.appendChild(headerElement);

    const content = document.createElement('div');
    content.className = 'main-content';

    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';

    const userListElement = this.userList.render();
    sidebar.appendChild(userListElement);

    const chatElement = this.chatDialog.render();

    content.appendChild(sidebar);
    content.appendChild(chatElement);

    this.element.appendChild(content);

    const footerElement = this.footer.render();
    this.element.appendChild(footerElement);

    return this.element;
  }

  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  updateUserName(newName: string): void {
    this.header.updateUserName(newName);
    this.chatDialog.setCurrentUser(newName);
  }

  setUsers(users: User[]): void {
    this.userList.setUsers(users);
  }

  setUnreadCount(userLogin: string, count: number): void {
    this.userList.setUnreadCount(userLogin, count);
  }

  setMessages(messages: Message[]): void {
    this.chatDialog.setMessages(messages);
  }

  addMessage(message: Message): void {
    this.chatDialog.addMessage(message);
  }

  updateMessageStatus(messageId: string, isDelivered: boolean, isReaded: boolean): void {
    this.chatDialog.updateMessageStatus(messageId, isDelivered, isReaded);
  }

  updateMessageText(messageId: string, newText: string, isEdited: boolean): void {
    this.chatDialog.updateMessageText(messageId, newText, isEdited);
  }

  deleteMessage(messageId: string): void {
    this.chatDialog.deleteMessage(messageId);
  }

  updateUserStatus(userLogin: string, isOnline: boolean): void {
    this.userList.updateUserStatus(userLogin, isOnline);
    if (userLogin === this.selectedUser) {
      this.chatDialog.updateUserStatus(isOnline);
    }
  }
}