import { Validators } from './validators';

export class AuthPage {
  private element: HTMLElement;
  private loginCallback: (login: string, password: string) => void;
  private showAboutCallback: () => void;

  constructor(
    loginCallback: (login: string, password: string) => void,
    showAboutCallback: () => void
  ) {
    this.loginCallback = loginCallback;
    this.showAboutCallback = showAboutCallback;
    this.element = document.createElement('div');
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = 'auth-page';

    const container = document.createElement('div');
    container.className = 'auth-container';

    const title = document.createElement('h1');
    title.textContent = 'Авторизация';
    title.className = 'auth-title';

    const loginLabel = document.createElement('label');
    loginLabel.textContent = 'Имя';
    loginLabel.className = 'auth-label';

    const loginInput = document.createElement('input');
    loginInput.type = 'text';
    loginInput.placeholder = 'Введите имя';
    loginInput.className = 'auth-input';
    loginInput.id = 'login-input';

    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Пароль';
    passwordLabel.className = 'auth-label';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.placeholder = 'Введите пароль';
    passwordInput.className = 'auth-input';
    passwordInput.id = 'password-input';

    const loginButton = document.createElement('button');
    loginButton.textContent = 'Войти';
    loginButton.className = 'auth-button';

    const aboutButton = document.createElement('button');
    aboutButton.textContent = 'Инфо';
    aboutButton.className = 'auth-info-button';

    const errorDiv = document.createElement('div');
    errorDiv.className = 'auth-error';
    errorDiv.id = 'auth-error';

    const languageButton = document.createElement('button');
    languageButton.textContent = 'RU';
    languageButton.className = 'auth-language-button';

    loginInput.addEventListener('input', () => this.validateForm());
    passwordInput.addEventListener('input', () => this.validateForm());

    loginButton.addEventListener('click', () => this.handleLogin());
    aboutButton.addEventListener('click', () => this.showAboutCallback());
    
    loginInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.handleLogin();
      }
    });

    passwordInput.addEventListener('keypress', (event) => {
      if (event.key === 'Enter') {
        this.handleLogin();
      }
    });

    container.appendChild(title);
    container.appendChild(loginLabel);
    container.appendChild(loginInput);
    container.appendChild(passwordLabel);
    container.appendChild(passwordInput);
    container.appendChild(loginButton);
    container.appendChild(aboutButton);
    container.appendChild(errorDiv);
    container.appendChild(languageButton);

    this.element.appendChild(container);

    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const date = new Date().toLocaleDateString('ru-RU');
    footer.textContent = time + ' ' + date;
    this.element.appendChild(footer);

    return this.element;
  }

  private validateForm(): void {
    const loginInput = document.getElementById('login-input') as HTMLInputElement;
    const passwordInput = document.getElementById('password-input') as HTMLInputElement;
    const loginButton = document.querySelector('.auth-button') as HTMLButtonElement;

    if (loginInput && passwordInput && loginButton) {
      const login = loginInput.value.trim();
      const password = passwordInput.value.trim();
      const error = Validators.validateLoginForm(login, password);
      loginButton.disabled = !!error;
    }
  }

  private handleLogin(): void {
    const loginInput = document.getElementById('login-input') as HTMLInputElement;
    const passwordInput = document.getElementById('password-input') as HTMLInputElement;
    
    if (loginInput && passwordInput) {
      const login = loginInput.value.trim();
      const password = passwordInput.value.trim();
      
      const error = Validators.validateLoginForm(login, password);
      if (error) {
        this.showError(error);
        return;
      }
      
      this.loginCallback(login, password);
    }
  }

  showError(message: string): void {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  clearError(): void {
    const errorDiv = document.getElementById('auth-error');
    if (errorDiv) {
      errorDiv.textContent = '';
      errorDiv.style.display = 'none';
    }
  }
}
