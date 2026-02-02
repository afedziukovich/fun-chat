export class Footer {
  private element: HTMLElement;

  constructor() {
    this.element = document.createElement('div');
  }

  render(): HTMLElement {
    this.element.innerHTML = '';
    this.element.className = 'footer';

    const currentYear = new Date().getFullYear();

    const content = document.createElement('div');
    content.className = 'footer-content';

    const rsschool = document.createElement('span');
    rsschool.textContent = 'RSSchool';

    const author = document.createElement('a');
    author.href = 'https://github.com/afedziukovich';
    author.textContent = 'afedziukovich';
    author.target = '_blank';
    author.rel = 'noopener noreferrer';

    const year = document.createElement('span');
    year.textContent = currentYear.toString();

    content.appendChild(rsschool);
    content.appendChild(author);
    content.appendChild(year);

    this.element.appendChild(content);

    return this.element;
  }
}
