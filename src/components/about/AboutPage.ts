export class AboutPage {
  private element: HTMLElement;

  constructor(private backCallback: () => void) {
    this.element = document.createElement('div');
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = 'about-page';

    const container = document.createElement('div');
    container.className = 'about-container';

    const title = document.createElement('h1');
    title.textContent = 'Веселый чат';
    title.className = 'about-title';

    const description = document.createElement('div');
    description.className = 'about-description';
    description.innerHTML = `
      Приложение разработано для демонстрации задания Fun Chat в рамках курса RSSchool JS/FE 2025Q3<br>
      Удаление пользователей и сообщений происходит один раз в сутки
    `;

    const author = document.createElement('div');
    author.className = 'about-author';
    author.textContent = 'Автор MikAleinik, Afedziukovich';

    const backButton = document.createElement('button');
    backButton.textContent = 'Вернуться назад';
    backButton.className = 'about-back-button';
    backButton.addEventListener('click', () => this.backCallback());

    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(author);
    container.appendChild(backButton);

    this.element.appendChild(container);

    return this.element;
  }
}
