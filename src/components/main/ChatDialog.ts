import { Message } from '../../api/types';
import { MessageItem } from './MessageItem';

export class ChatDialog {
  private element: HTMLElement;
  private messages: Message[] = [];
  private currentUser: string = '';
  private selectedUser: string = '';
  private messageItems: Map<string, MessageItem> = new Map();
  private hasUnreadDivider: boolean = false;
  private unreadDividerElement: HTMLElement | null = null;
  private lastReadIndex: number = -1;

  private static readonly CLASS_NAMES = {
    CHAT_DIALOG: 'chat-dialog',
    DIALOG_HEADER: 'dialog-header',
    DIALOG_USER_INFO: 'dialog-user-info',
    DIALOG_USER_STATUS: 'dialog-user-status',
    ONLINE: 'online',
    OFFLINE: 'offline',
    MESSAGES_CONTAINER: 'messages-container',
    EMPTY_DIALOG_MESSAGE: 'empty-dialog-message',
    MESSAGE_INPUT_CONTAINER: 'message-input-container',
    MESSAGE_INPUT: 'message-input',
    SEND_BUTTON: 'send-button',
    UNREAD_DIVIDER: 'unread-divider'
  } as const;

  private static readonly TEXT = {
    SELECT_USER: 'Выберите пользователя для отправки сообщения...',
    START_OF_DIALOG: 'Это начало диалога',
    YOUR_MESSAGE: 'Ваше сообщение...',
    SEND: 'Отправить',
    NEW_MESSAGES: 'Новые сообщения',
    ONLINE: 'В сети',
    OFFLINE: 'Не в сети'
  } as const;

  constructor(
    private onSendMessage: (text: string) => void,
    private onDeleteMessage: (messageId: string) => void,
    private onEditMessage: (messageId: string, newText: string) => void,
    private onMarkAsRead: (messageId: string) => void
  ) {
    this.element = document.createElement('div');
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = ChatDialog.CLASS_NAMES.CHAT_DIALOG;

    const dialogHeader = document.createElement('div');
    dialogHeader.className = ChatDialog.CLASS_NAMES.DIALOG_HEADER;

    const userInfo = document.createElement('div');
    userInfo.className = ChatDialog.CLASS_NAMES.DIALOG_USER_INFO;
    userInfo.id = ChatDialog.CLASS_NAMES.DIALOG_USER_INFO;

    const statusIndicator = document.createElement('span');
    statusIndicator.className = ChatDialog.CLASS_NAMES.DIALOG_USER_STATUS;
    statusIndicator.id = ChatDialog.CLASS_NAMES.DIALOG_USER_STATUS;

    userInfo.appendChild(statusIndicator);
    dialogHeader.appendChild(userInfo);
    this.element.appendChild(dialogHeader);

    const messagesContainer = document.createElement('div');
    messagesContainer.className = ChatDialog.CLASS_NAMES.MESSAGES_CONTAINER;
    messagesContainer.id = ChatDialog.CLASS_NAMES.MESSAGES_CONTAINER;

    messagesContainer.addEventListener('scroll', () => this.handleScroll());
    messagesContainer.addEventListener('click', () => this.handleClick());

    this.element.appendChild(messagesContainer);

    const inputContainer = document.createElement('div');
    inputContainer.className = ChatDialog.CLASS_NAMES.MESSAGE_INPUT_CONTAINER;

    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.placeholder = ChatDialog.TEXT.YOUR_MESSAGE;
    messageInput.className = ChatDialog.CLASS_NAMES.MESSAGE_INPUT;
    messageInput.id = ChatDialog.CLASS_NAMES.MESSAGE_INPUT;
    messageInput.disabled = !this.selectedUser;

    const sendButton = document.createElement('button');
    sendButton.textContent = ChatDialog.TEXT.SEND;
    sendButton.className = ChatDialog.CLASS_NAMES.SEND_BUTTON;
    sendButton.id = ChatDialog.CLASS_NAMES.SEND_BUTTON;
    sendButton.disabled = !this.selectedUser;

    messageInput.addEventListener('keypress', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !sendButton.disabled) {
        this.sendMessage();
      }
    });

    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });

    inputContainer.appendChild(messageInput);
    inputContainer.appendChild(sendButton);
    this.element.appendChild(inputContainer);

    this.updateDialogInfo();
    this.renderMessages();

    return this.element;
  }

  setCurrentUser(userLogin: string): void {
    this.currentUser = userLogin;
  }

  setSelectedUser(userLogin: string, isOnline: boolean): void {
    this.selectedUser = userLogin;
    this.messages = [];
    this.messageItems.clear();
    this.hasUnreadDivider = false;
    this.lastReadIndex = -1;

    const messageInput = document.getElementById(ChatDialog.CLASS_NAMES.MESSAGE_INPUT) as HTMLInputElement;
    const sendButton = document.getElementById(ChatDialog.CLASS_NAMES.SEND_BUTTON) as HTMLButtonElement;

    if (messageInput && sendButton) {
      messageInput.disabled = !userLogin;
      sendButton.disabled = !userLogin;
      messageInput.value = '';
    }

    this.updateDialogInfo(userLogin, isOnline);
    this.renderMessages();
  }

  setMessages(messages: Message[]): void {
    this.messages = messages.sort((a, b) => a.datetime - b.datetime);
    this.messageItems.clear();

    const lastReadIndex = this.findLastReadIndex();
    if (lastReadIndex !== -1 && lastReadIndex < this.messages.length - 1) {
      this.hasUnreadDivider = true;
      this.lastReadIndex = lastReadIndex;
    } else {
      this.hasUnreadDivider = false;
      this.lastReadIndex = -1;
    }

    this.renderMessages();
  }

  addMessage(message: Message): void {
    this.messages.push(message);
    this.messageItems.delete(message.id);

    if (message.to === this.currentUser && !message.status.isReaded) {
      this.hasUnreadDivider = true;
    }

    this.renderMessages();
    this.scrollToBottom();
  }

  updateMessageStatus(messageId: string, isDelivered: boolean, isReaded: boolean): void {
    const messageItem = this.messageItems.get(messageId);
    if (messageItem) {
      messageItem.updateStatus(isDelivered, isReaded);
    }

    if (isReaded && this.hasUnreadDivider) {
      const messageIndex = this.messages.findIndex(msg => msg.id === messageId);
      if (messageIndex > this.lastReadIndex) {
        this.lastReadIndex = messageIndex;
        this.checkUnreadDivider();
      }
    }
  }

  updateMessageText(messageId: string, newText: string, isEdited: boolean): void {
    const messageItem = this.messageItems.get(messageId);
    if (messageItem) {
      messageItem.updateText(newText, isEdited);
    }
  }

  deleteMessage(messageId: string): void {
    const messageItem = this.messageItems.get(messageId);
    if (messageItem) {
      messageItem.markAsDeleted();
    }
  }

  updateUserStatus(isOnline: boolean): void {
    this.updateDialogInfo(this.selectedUser, isOnline);
  }

  private updateDialogInfo(userLogin?: string, isOnline?: boolean): void {
    const userInfo = document.getElementById(ChatDialog.CLASS_NAMES.DIALOG_USER_INFO);
    const statusIndicator = document.getElementById(ChatDialog.CLASS_NAMES.DIALOG_USER_STATUS);

    if (!userInfo || !statusIndicator) return;

    if (userLogin) {
      statusIndicator.textContent = userLogin;
      statusIndicator.className = `${ChatDialog.CLASS_NAMES.DIALOG_USER_STATUS} ${isOnline ? ChatDialog.CLASS_NAMES.ONLINE : ChatDialog.CLASS_NAMES.OFFLINE}`;
      statusIndicator.title = isOnline ? ChatDialog.TEXT.ONLINE : ChatDialog.TEXT.OFFLINE;
    } else {
      statusIndicator.textContent = ChatDialog.TEXT.SELECT_USER;
      statusIndicator.className = ChatDialog.CLASS_NAMES.DIALOG_USER_STATUS;
    }
  }

  private renderMessages(): void {
    const messagesContainer = document.getElementById(ChatDialog.CLASS_NAMES.MESSAGES_CONTAINER);
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    if (this.messages.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = ChatDialog.CLASS_NAMES.EMPTY_DIALOG_MESSAGE;

      if (this.selectedUser) {
        emptyMessage.textContent = ChatDialog.TEXT.START_OF_DIALOG;
      } else {
        emptyMessage.textContent = ChatDialog.TEXT.SELECT_USER;
      }

      messagesContainer.appendChild(emptyMessage);
      return;
    }

    this.messages.forEach((message, index) => {
      const isCurrentUser = message.from === this.currentUser;

      if (this.hasUnreadDivider && index === this.lastReadIndex + 1) {
        this.unreadDividerElement = document.createElement('div');
        this.unreadDividerElement.className = ChatDialog.CLASS_NAMES.UNREAD_DIVIDER;
        this.unreadDividerElement.textContent = ChatDialog.TEXT.NEW_MESSAGES;
        messagesContainer.appendChild(this.unreadDividerElement);
      }

      const messageItem = new MessageItem(
        message,
        isCurrentUser,
        isCurrentUser ? this.onDeleteMessage : undefined,
        isCurrentUser ? this.onEditMessage : undefined
      );

      const messageElement = messageItem.render();
      this.messageItems.set(message.id, messageItem);

      if (message.to === this.currentUser && !message.status.isReaded) {
        this.onMarkAsRead(message.id);
      }

      messagesContainer.appendChild(messageElement);
    });

    this.scrollToBottom();
  }

  private sendMessage(): void {
    const messageInput = document.getElementById(ChatDialog.CLASS_NAMES.MESSAGE_INPUT) as HTMLInputElement;
    if (!messageInput) return;

    const text = messageInput.value.trim();

    if (!text) {
      console.warn('Попытка отправить пустое сообщение');
      return;
    }

    this.onSendMessage(text);
    messageInput.value = '';
  }

  private scrollToBottom(): void {
    const messagesContainer = document.getElementById(ChatDialog.CLASS_NAMES.MESSAGES_CONTAINER);
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private handleScroll(): void {
    if (this.hasUnreadDivider && this.unreadDividerElement) {
      const container = document.getElementById(ChatDialog.CLASS_NAMES.MESSAGES_CONTAINER);
      if (container) {
        const dividerRect = this.unreadDividerElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (dividerRect.top > containerRect.top) {
          this.removeUnreadDivider();
        }
      }
    }
  }

  private handleClick(): void {
    if (this.hasUnreadDivider) {
      this.removeUnreadDivider();
    }
  }

  private removeUnreadDivider(): void {
    this.hasUnreadDivider = false;
    if (this.unreadDividerElement) {
      this.unreadDividerElement.remove();
      this.unreadDividerElement = null;
    }
  }

  private findLastReadIndex(): number {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].status.isReaded) {
        return i;
      }
    }
    return -1;
  }

  private checkUnreadDivider(): void {
    const hasUnreadMessages = this.messages.some((msg, index) =>
      index > this.lastReadIndex && !msg.status.isReaded
    );

    if (!hasUnreadMessages && this.hasUnreadDivider) {
      this.removeUnreadDivider();
    }
  }
}