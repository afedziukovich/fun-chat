export type RouteHandler = () => void;

export class Router {
  private routes: Map<string, RouteHandler> = new Map();
  private currentRoute: string = '';

  constructor() {
    window.addEventListener('hashchange', () => {
      this.handleRouteChange();
    });

    window.addEventListener('load', () => {
      this.handleRouteChange();
    });
  }

  addRoute(path: string, handler: RouteHandler): void {
    console.log(`Router: добавлен маршрут ${path}`);

    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    this.routes.set(normalizedPath, handler);
  }

  navigate(path: string): void {
    console.log(`Router: переход на ${path}, текущий маршрут ${this.currentRoute}`);

    const normalizedPath = path.startsWith('/') ? path : '/' + path;

    if (normalizedPath !== this.currentRoute) {

      window.location.hash = normalizedPath;
      this.currentRoute = normalizedPath;
    } else {
      console.log('Router: уже на этом маршруте, повторный вызов обработчика');
      const handler = this.routes.get(normalizedPath);
      if (handler) handler();
    }
  }

  getCurrentPath(): string {
    const hash = window.location.hash.slice(1);
    return hash || '/login';
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
        console.error('Router: обработчик не найден, перенаправляем на логин');
        this.navigate('/login');
      }
    }
  }
}