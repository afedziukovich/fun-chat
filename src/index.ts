import { App } from './core/app';
import './styles/main.scss';

function initializeApp(): void {
  try {
    const app = new App();
    app.init();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showErrorPage(error instanceof Error ? error.message : 'Unknown error');
  }
}

function showErrorPage(errorMessage: string): void {
  const appContainer = document.getElementById('app');

  if (appContainer) {
    appContainer.innerHTML = `
      <div class="error-container">
        <h2>Application Error</h2>
        <p>${errorMessage}</p>
        <p>Please reload the page</p>
        <button onclick="window.location.reload()">Reload</button>
      </div>
    `;
  }
}

function main(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}

main();