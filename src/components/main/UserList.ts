import { User } from '../../api/types';

export class UserList {
  private element: HTMLElement;
  private users: User[] = [];
  private currentUser: string = '';
  private unreadCounts: Map<string, number> = new Map();
  private userClickCallback: (userLogin: string) => void = () => {};

  constructor() {
    this.element = document.createElement('div');
  }

  setUserClickCallback(callback: (userLogin: string) => void): void {
    this.userClickCallback = callback;
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = 'user-list';

    const searchContainer = document.createElement('div');
    searchContainer.className = 'user-search-container';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Поиск...';
    searchInput.className = 'user-search-input';
    searchInput.addEventListener('input', (event) => {
      this.filterUsers((event.target as HTMLInputElement).value);
    });

    searchContainer.appendChild(searchInput);
    this.element.appendChild(searchContainer);

    const usersContainer = document.createElement('div');
    usersContainer.className = 'users-container';
    usersContainer.id = 'users-container';

    this.element.appendChild(usersContainer);

    this.renderUsers();

    return this.element;
  }

  setCurrentUser(userLogin: string): void {
    this.currentUser = userLogin;
    this.renderUsers();
  }

  setUsers(users: User[]): void {
    this.users = users.filter(user => user.login !== this.currentUser);
    this.renderUsers();
  }

  setUnreadCount(userLogin: string, count: number): void {
    this.unreadCounts.set(userLogin, count);
    this.updateUserItem(userLogin);
  }

  private filterUsers(searchTerm: string): void {
    const filteredUsers = this.users.filter(user => 
      user.login.toLowerCase().includes(searchTerm.toLowerCase())
    );
    this.renderFilteredUsers(filteredUsers);
  }

  private renderUsers(): void {
    const filteredUsers = this.users.filter(user => 
      user.login !== this.currentUser
    );
    this.renderFilteredUsers(filteredUsers);
  }

  private renderFilteredUsers(users: User[]): void {
    const usersContainer = document.getElementById('users-container');
    if (!usersContainer) return;

    usersContainer.innerHTML = '';

    if (users.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'user-empty-message';
      emptyMessage.textContent = 'Нет пользователей';
      usersContainer.appendChild(emptyMessage);
      return;
    }

    users.forEach(user => {
      const userElement = this.createUserElement(user);
      usersContainer.appendChild(userElement);
    });
  }

  private createUserElement(user: User): HTMLElement {
    const userElement = document.createElement('div');
    userElement.className = 'user-item';
    userElement.dataset.login = user.login;

    const userName = document.createElement('span');
    userName.className = 'user-name';
    userName.textContent = user.login;

    const statusIndicator = document.createElement('span');
    statusIndicator.className = 'user-status ' + (user.isLogined ? 'online' : 'offline');
    (statusIndicator as HTMLElement).title = user.isLogined ? 'В сети' : 'Не в сети';

    const unreadBadge = document.createElement('span');
    unreadBadge.className = 'user-unread-badge';
    const unreadCount = this.unreadCounts.get(user.login) || 0;
    if (unreadCount > 0) {
      unreadBadge.textContent = unreadCount.toString();
      unreadBadge.style.display = 'inline-block';
    } else {
      unreadBadge.style.display = 'none';
    }

    userElement.appendChild(userName);
    userElement.appendChild(statusIndicator);
    userElement.appendChild(unreadBadge);

    userElement.addEventListener('click', () => {
      this.userClickCallback(user.login);
    });

    return userElement;
  }

  private updateUserItem(userLogin: string): void {
    const userElement = this.element.querySelector('.user-item[data-login="' + userLogin + '"]');
    if (!userElement) return;

    const unreadBadge = userElement.querySelector('.user-unread-badge') as HTMLElement;
    const unreadCount = this.unreadCounts.get(userLogin) || 0;
    
    if (unreadBadge) {
      if (unreadCount > 0) {
        unreadBadge.textContent = unreadCount.toString();
        unreadBadge.style.display = 'inline-block';
      } else {
        unreadBadge.style.display = 'none';
      }
    }
  }

  updateUserStatus(userLogin: string, isLogined: boolean): void {
    const user = this.users.find(u => u.login === userLogin);
    if (user) {
      user.isLogined = isLogined;
      const userElement = this.element.querySelector('.user-item[data-login="' + userLogin + '"]');
      if (userElement) {
        const statusIndicator = userElement.querySelector('.user-status');
        if (statusIndicator) {
          statusIndicator.className = 'user-status ' + (isLogined ? 'online' : 'offline');
          (statusIndicator as HTMLElement).title = isLogined ? 'В сети' : 'Не в сети';
        }
      }
    }
  }
}
