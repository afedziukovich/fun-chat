export type RouteHandler = () => void;

export class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private currentRoute: string = '';

  constructor() {
    window.addEventListener('popstate', () => {
      this.handleRouteChange();
    });
  }

  addRoute(path: string, handler: RouteHandler): void {
    this.routes.set(path, handler);
  }

  navigate(path: string): void {
    if (path !== this.currentRoute) {
      window.history.pushState({}, '', path);
      this.currentRoute = path;
      this.handleRouteChange();
    }
  }

  getCurrentPath(): string {
    return window.location.pathname;
  }

  start(): void {
    this.handleRouteChange();
  }

  private handleRouteChange(): void {
    const path = this.getCurrentPath();
    this.currentRoute = path;

    const handler = this.routes.get(path);
    if (handler) {
      handler();
    } else {
      const defaultHandler = this.routes.get('/');
      if (defaultHandler) {
        defaultHandler();
      }
    }
  }
}
