export class Validators {
  static validateLogin(login: string): string {
    if (login.length < 4 || login.length > 12) {
      return 'Логин должен быть от 4 до 12 символов';
    }
    if (!/^[a-zA-Z0-9]+$/.test(login)) {
      return 'Логин должен содержать только латинские буквы и цифры';
    }
    return '';
  }

  static validatePassword(password: string): string {
    if (password.length < 4 || password.length > 12) {
      return 'Пароль должен быть от 4 до 12 символов';
    }
    if (!/^[a-zA-Z0-9]+$/.test(password)) {
      return 'Пароль должен содержать только латинские буквы и цифры';
    }
    return '';
  }

  static validateLoginForm(login: string, password: string): string {
    const loginError = this.validateLogin(login);
    if (loginError) return loginError;
    
    const passwordError = this.validatePassword(password);
    if (passwordError) return passwordError;
    
    return '';
  }
}
