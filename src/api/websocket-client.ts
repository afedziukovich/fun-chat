import {
  WebSocketEvent,
  WebSocketRequest,
  ServerResponse
} from './types';

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, (response: ServerResponse) => void> = new Map();
  private eventHandlers: Map<string, ((data: unknown) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(url: string): void {
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.emitEvent(WebSocketEvent.CONNECTED, null);
    };

    this.socket.onmessage = (event) => {
      try {
        const response: ServerResponse = JSON.parse(event.data);
        this.handleMessage(response);
      } catch (error) {
        console.error('WebSocket JSON parse error:', error);
      }
    };

    this.socket.onclose = () => {
      this.emitEvent(WebSocketEvent.DISCONNECTED, null);
      this.attemptReconnect(url);
    };

    this.socket.onerror = (error) => {
      this.emitEvent(WebSocketEvent.ERROR, error);
    };
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        this.connect(url);
      }, this.reconnectDelay);
    }
  }

  private handleMessage(response: ServerResponse): void {
    if (response.id && this.messageHandlers.has(response.id)) {
      const handler = this.messageHandlers.get(response.id);
      if (handler) {
        handler(response);
        this.messageHandlers.delete(response.id);
      }
    }

    this.emitEvent(response.type, response.payload);
  }

  sendRequest(request: WebSocketRequest): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(request));
    } else {
      console.error('WebSocket not connected');
    }
  }

  onMessage(id: string, handler: (response: ServerResponse) => void): void {
    this.messageHandlers.set(id, handler);
  }

  onEvent(eventType: string, handler: (data: unknown) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)?.push(handler);
  }

  private emitEvent(eventType: string, data: unknown): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('Event handler error:', error);
        }
      });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}