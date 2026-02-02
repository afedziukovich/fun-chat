import { Header } from './Header';
import { Footer } from './Footer';
import { UserList } from './UserList';
import { ChatDialog } from './ChatDialog';
import { User, Message } from '../../api/types';

export class MainPage {
  private element: HTMLElement;
  private header: Header;
  private footer: Footer;
  private userList: UserList;
  private chatDialog: ChatDialog;
  private selectedUser: string = '';

  constructor(
    userName: string,
    logoutCallback: () => void,
    showAboutCallback: () => void,
    sendMessageCallback: (to: string, text: string) => void,
    deleteMessageCallback: (messageId: string) => void,
    editMessageCallback: (messageId: string, newText: string) => void,
    markAsReadCallback: (messageId: string) => void,
    requestMessagesCallback: (userLogin: string) => void
  ) {
    this.element = document.createElement('div');
    this.element.className = 'main-page';

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
