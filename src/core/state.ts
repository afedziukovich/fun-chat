import { User, Message } from '../api/types';

export interface AppState {
  currentUser: string | null;
  isAuthenticated: boolean;
  users: User[];
  messages: Record<string, Message[]>;
  userStatuses: Record<string, { isOnline: boolean }>;
  unreadCounts: Record<string, number>;
}

export class StateManager {
  private state: AppState = {
    currentUser: null,
    isAuthenticated: false,
    users: [],
    messages: {},
    userStatuses: {},
    unreadCounts: {}
  };

  private listeners: Set<(state: AppState) => void> = new Set();

  getState(): AppState {
    return { ...this.state };
  }

  setCurrentUser(user: string | null): void {
    this.state.currentUser = user;
    this.notifyListeners();
  }

  setAuthenticated(authenticated: boolean): void {
    this.state.isAuthenticated = authenticated;
    this.notifyListeners();
  }

  setUsers(users: User[]): void {
    this.state.users = users;
    this.notifyListeners();
  }

  setMessages(messages: Message[]): void {
    if (messages.length === 0) return;

    const firstMessage = messages[0];
    const otherUser = firstMessage.from === this.state.currentUser ? firstMessage.to : firstMessage.from;

    this.state.messages[otherUser] = messages;
    this.notifyListeners();
  }

  addMessage(message: Message): void {
    const otherUser = message.from === this.state.currentUser ? message.to : message.from;

    if (!this.state.messages[otherUser]) {
      this.state.messages[otherUser] = [];
    }

    this.state.messages[otherUser].push(message);
    this.notifyListeners();
  }

  setUnreadCount(userLogin: string, count: number): void {
    this.state.unreadCounts[userLogin] = count;
    this.notifyListeners();
  }

  updateUserStatus(userLogin: string, isOnline: boolean): void {
    this.state.userStatuses[userLogin] = { isOnline };
    this.notifyListeners();
  }

  updateMessageStatus(messageId: string, isDelivered: boolean, isReaded: boolean): void {
    for (const userLogin in this.state.messages) {
      const message = this.state.messages[userLogin].find(msg => msg.id === messageId);
      if (message) {
        message.status.isDelivered = isDelivered;
        message.status.isReaded = isReaded;
        this.notifyListeners();
        break;
      }
    }
  }

  updateMessageText(messageId: string, newText: string): void {
    for (const userLogin in this.state.messages) {
      const message = this.state.messages[userLogin].find(msg => msg.id === messageId);
      if (message) {
        message.text = newText;
        message.status.isEdited = true;
        this.notifyListeners();
        break;
      }
    }
  }

  deleteMessage(messageId: string): void {
    for (const userLogin in this.state.messages) {
      const messageIndex = this.state.messages[userLogin].findIndex(msg => msg.id === messageId);
      if (messageIndex !== -1) {
        this.state.messages[userLogin][messageIndex].status.isDeleted = true;
        this.notifyListeners();
        break;
      }
    }
  }

  subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('StateManager listener error:', error);
      }
    });
  }
}