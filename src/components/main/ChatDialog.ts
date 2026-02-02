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
    this.element.className = 'chat-dialog';

    const dialogHeader = document.createElement('div');
    dialogHeader.className = 'dialog-header';

    const userInfo = document.createElement('div');
    userInfo.className = 'dialog-user-info';
    userInfo.id = 'dialog-user-info';

    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'dialog-user-status';
    statusIndicator.id = 'dialog-user-status';

    userInfo.appendChild(statusIndicator);

    dialogHeader.appendChild(userInfo);
    this.element.appendChild(dialogHeader);

    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'messages-container';
    messagesContainer.id = 'messages-container';

    messagesContainer.addEventListener('scroll', () => this.handleScroll());
    messagesContainer.addEventListener('click', () => this.handleClick());

    this.element.appendChild(messagesContainer);

    const inputContainer = document.createElement('div');
    inputContainer.className = 'message-input-container';

    const messageInput = document.createElement('input');
    messageInput.type = 'text';
    messageInput.placeholder = 'Ваше сообщение...';
    messageInput.className = 'message-input';
    messageInput.id = 'message-input';
    messageInput.disabled = !this.selectedUser;

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Отправить';
    sendButton.className = 'send-button';
    sendButton.id = 'send-button';
    sendButton.disabled = !this.selectedUser;

    messageInput.addEventListener('keypress', (event) => {
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
    
    const messageInput = document.getElementById('message-input') as HTMLInputElement;
    const sendButton = document.getElementById('send-button') as HTMLButtonElement;
    
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
    const userInfo = document.getElementById('dialog-user-info');
    const statusIndicator = document.getElementById('dialog-user-status');
    
    if (!userInfo || !statusIndicator) return;
    
    if (userLogin) {
      statusIndicator.textContent = userLogin;
      statusIndicator.className = `dialog-user-status ${isOnline ? 'online' : 'offline'}`;
      statusIndicator.title = isOnline ? 'В сети' : 'Не в сети';
    } else {
      statusIndicator.textContent = 'Выберите пользователя для отправки сообщения...';
      statusIndicator.className = 'dialog-user-status';
    }
  }

  private renderMessages(): void {
    const messagesContainer = document.getElementById('messages-container');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = '';

    if (this.messages.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-dialog-message';
      
      if (this.selectedUser) {
        emptyMessage.textContent = 'Это начало диалога';
      } else {
        emptyMessage.textContent = 'Выберите пользователя для отправки сообщения...';
      }
      
      messagesContainer.appendChild(emptyMessage);
      return;
    }

    this.messages.forEach((message, index) => {
      const isCurrentUser = message.from === this.currentUser;
      
      if (this.hasUnreadDivider && index === this.lastReadIndex + 1) {
        this.unreadDividerElement = document.createElement('div');
        this.unreadDividerElement.className = 'unread-divider';
        this.unreadDividerElement.textContent = 'Новые сообщения';
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
    const messageInput = document.getElementById('message-input') as HTMLInputElement;
    if (!messageInput || !messageInput.value.trim()) return;

    const text = messageInput.value.trim();
    this.onSendMessage(text);
    messageInput.value = '';
  }

  private scrollToBottom(): void {
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
  }

  private handleScroll(): void {
    if (this.hasUnreadDivider && this.unreadDividerElement) {
      const container = document.getElementById('messages-container');
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
