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
    console.log(`Router: добавлен маршрут ${path}`);
    this.routes.set(path, handler);
  }

  navigate(path: string): void {
    console.log(`Router: переход на ${path}, текущий маршрут ${this.currentRoute}`);
    if (path !== this.currentRoute) {
      window.history.pushState({}, '', path);
      this.currentRoute = path;
      this.handleRouteChange();
    } else {
      console.log('Router: уже на этом маршруте, повторный вызов обработчика');
      const handler = this.routes.get(path);
      if (handler) handler();
    }
  }

  getCurrentPath(): string {
    return window.location.pathname;
  }

  start(): void {
    console.log('Router: запущен');
    this.handleRouteChange();
  }

  private handleRouteChange(): void {
    const path = this.getCurrentPath();
    console.log(`Router: обработка маршрута ${path}`);
    this.currentRoute = path;

    const handler = this.routes.get(path);
    if (handler) {
      console.log(`Router: найден обработчик для ${path}`);
      handler();
    } else {
      console.log(`Router: обработчик для ${path} не найден, пробуем корневой маршрут`);
      const defaultHandler = this.routes.get('/');
      if (defaultHandler) {
        console.log('Router: используется корневой обработчик');
        defaultHandler();
      } else {
        console.error('Router: корневой обработчик не найден');
      }
    }
  }
}