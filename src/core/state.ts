import { User, Message } from '../api/types';

export interface AppState {
  currentUser: string | null;
  isAuthenticated: boolean;
  users: User[];
  messages: Message[];
  activeChatUser: string | null;
  unreadCounts: Map<string, number>;
}

export class StateManager {
  private state: AppState = {
    currentUser: null,
    isAuthenticated: false,
    users: [],
    messages: [],
    activeChatUser: null,
    unreadCounts: new Map()
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
    this.state.messages = messages;
    this.notifyListeners();
  }

  addMessage(message: Message): void {
    this.state.messages.push(message);
    this.notifyListeners();
  }

  setActiveChatUser(userLogin: string | null): void {
    this.state.activeChatUser = userLogin;
    this.notifyListeners();
  }

  setUnreadCount(userLogin: string, count: number): void {
    this.state.unreadCounts.set(userLogin, count);
    this.notifyListeners();
  }

  updateMessageStatus(messageId: string, isDelivered: boolean, isReaded: boolean): void {
    const message = this.state.messages.find(msg => msg.id === messageId);
    if (message) {
      message.status.isDelivered = isDelivered;
      message.status.isReaded = isReaded;
      this.notifyListeners();
    }
  }

  updateMessageText(messageId: string, newText: string): void {
    const message = this.state.messages.find(msg => msg.id === messageId);
    if (message) {
      message.text = newText;
      message.status.isEdited = true;
      this.notifyListeners();
    }
  }

  deleteMessage(messageId: string): void {
    const message = this.state.messages.find(msg => msg.id === messageId);
    if (message) {
      message.status.isDeleted = true;
      this.notifyListeners();
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
      listener(state);
    });
  }
}
