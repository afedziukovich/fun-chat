export class RedirectHandler {
    static readonly BASE_PATH = '/fun-chat/';
    static readonly ALLOWED_PATHS = ['/', '/index.html', '/fun-chat/', '/fun-chat/index.html'];

    static init(): void {
      this.handleInitialRedirect();
    }

    private static handleInitialRedirect(): void {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      if (this.needsRedirect(path)) {
        this.saveOriginalPath(path + search + hash);

        this.redirectToApp();
      }
    }

    private static needsRedirect(path: string): boolean {
      if (path === this.BASE_PATH || path === this.BASE_PATH + 'index.html') {
        return false;
      }

      if (this.ALLOWED_PATHS.includes(path)) {
        return false;
      }

      if (window.location.hash) {
        return false;
      }

      return true;
    }

    private static saveOriginalPath(fullPath: string): void {
      try {
        let pathToSave = fullPath.replace(this.BASE_PATH, '');
        if (pathToSave.startsWith('/')) {
          pathToSave = pathToSave.substring(1);
        }

        if (pathToSave) {
          sessionStorage.setItem('spa_redirect', pathToSave);
        }
      } catch (error) {
        console.warn('Failed to save redirect path:', error);
      }
    }

    private static redirectToApp(): void {
      const newUrl = this.BASE_PATH + (this.BASE_PATH.endsWith('/') ? '' : '/') + 'index.html';
      window.location.replace(newUrl);
    }

    static getRedirectPath(): string | null {
      try {
        return sessionStorage.getItem('spa_redirect');
      } catch (error) {
        console.warn('Failed to get redirect path:', error);
        return null;
      }
    }

    static clearRedirect(): void {
      try {
        sessionStorage.removeItem('spa_redirect');
      } catch (error) {
        console.warn('Failed to clear redirect:', error);
      }
    }
  }