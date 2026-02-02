export class Header {
  private element: HTMLElement;

  constructor(
    private userName: string,
    private logoutCallback: () => void,
    private showAboutCallback: () => void
  ) {
    this.element = document.createElement('div');
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = 'header';

    const userInfo = document.createElement('div');
    userInfo.className = 'header-user-info';
    userInfo.textContent = `Пользователь: ${this.userName}`;

    const appName = document.createElement('div');
    appName.className = 'header-app-name';
    appName.textContent = 'Веселый чатик';

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'header-buttons';

    const aboutButton = document.createElement('button');
    aboutButton.textContent = 'Инфо';
    aboutButton.className = 'header-button';
    aboutButton.addEventListener('click', () => this.showAboutCallback());

    const logoutButton = document.createElement('button');
    logoutButton.textContent = 'Выход';
    logoutButton.className = 'header-button';
    logoutButton.addEventListener('click', () => this.logoutCallback());

    const languageButton = document.createElement('button');
    languageButton.textContent = 'RU';
    languageButton.className = 'header-language-button';

    buttonsContainer.appendChild(aboutButton);
    buttonsContainer.appendChild(logoutButton);
    buttonsContainer.appendChild(languageButton);

    this.element.appendChild(userInfo);
    this.element.appendChild(appName);
    this.element.appendChild(buttonsContainer);

    return this.element;
  }

  updateUserName(newName: string): void {
    this.userName = newName;
    const userInfo = this.element.querySelector('.header-user-info');
    if (userInfo) {
      userInfo.textContent = `Пользователь: ${newName}`;
    }
  }
}
