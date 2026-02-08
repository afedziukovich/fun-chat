export class Router {
  private routes: Map<string, () => void> = new Map();

  constructor() {
    window.addEventListener('hashchange', () => this.handleRoute());
  }

  addRoute(path: string, handler: () => void): void {
    this.routes.set(path, handler);
  }

  navigate(path: string): void {
    window.location.hash = path;
  }

  start(): void {
    this.handleRoute();
  }

  private handleRoute(): void {
    const path = window.location.hash.slice(1) || '/login';
    const handler = this.routes.get(path);
    if (handler) {
      handler();
    } else {
      console.error('Route not found:', path);
    }
  }
}