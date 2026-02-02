import { ServerRequest, ServerResponse } from './types';

export class WebSocketClient {
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, (response: ServerResponse) => void> = new Map();
  private eventHandlers: Map<string, ((data: unknown) => void)[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  constructor() {
    console.log('🔌 [WebSocketClient] Конструктор вызван');
  }

  connect(url: string): void {
    console.log('🔌 [WebSocketClient] connect() вызван с URL:', url);
    console.log('🔌 [WebSocketClient] Текущее время:', new Date().toLocaleTimeString());

    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.log('✅ [WebSocketClient] СОЕДИНЕНИЕ УСТАНОВЛЕНО!');
      console.log('✅ [WebSocketClient] WebSocket.OPEN =', WebSocket.OPEN);
      console.log('✅ [WebSocketClient] readyState =', this.socket?.readyState);
      this.reconnectAttempts = 0;
      this.emitEvent('connected', null);
    };

    this.socket.onmessage = (event) => {
      console.log('📨 [WebSocketClient] Получено сообщение от сервера');
      console.log('📨 [WebSocketClient] RAW данные:', event.data);

      try {
        const response: ServerResponse = JSON.parse(event.data);
        console.log('📨 [WebSocketClient] Parsed данные:', response);
        console.log('📨 [WebSocketClient] Тип события:', response.type);

        if (response.payload) {
          console.log('📨 [WebSocketClient] Payload:', response.payload);
        }

        this.handleMessage(response);
      } catch (error) {
        console.error('❌ [WebSocketClient] Ошибка парсинга JSON:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('⚠️ [WebSocketClient] Соединение закрыто');
      console.log('⚠️ [WebSocketClient] Попытка переподключения:', this.reconnectAttempts + 1);
      this.emitEvent('disconnected', null);
      this.attemptReconnect(url);
    };

    this.socket.onerror = (error) => {
      console.error('❌ [WebSocketClient] WebSocket ошибка:', error);
      this.emitEvent('error', error);
    };
  }

  private attemptReconnect(url: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log('🔄 [WebSocketClient] Переподключение через', this.reconnectDelay, 'мс');
      setTimeout(() => {
        console.log('🔄 [WebSocketClient] Пытаюсь переподключиться...');
        this.connect(url);
      }, this.reconnectDelay);
    } else {
      console.error('❌ [WebSocketClient] Максимальное количество попыток переподключения достигнуто');
    }
  }

  private handleMessage(response: ServerResponse): void {
    console.log('📨 [WebSocketClient] handleMessage() вызван');
    console.log('📨 [WebSocketClient] Response ID:', response.id);
    console.log('📨 [WebSocketClient] Response Type:', response.type);

    if (response.id && this.messageHandlers.has(response.id)) {
      const handler = this.messageHandlers.get(response.id);
      if (handler) {
        console.log('📨 [WebSocketClient] Найден обработчик для ID:', response.id);
        handler(response);
        this.messageHandlers.delete(response.id);
      }
    }

    this.emitEvent(response.type, response.payload);
  }

  sendRequest(request: ServerRequest): void {
    console.log('📤 [WebSocketClient] sendRequest() вызван');
    console.log('📤 [WebSocketClient] Request:', request);
    console.log('📤 [WebSocketClient] readyState:', this.socket?.readyState);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify(request);
      console.log('📤 [WebSocketClient] Отправляю сообщение:', message);
      this.socket.send(message);
    } else {
      console.error('❌ [WebSocketClient] WebSocket НЕ ПОДКЛЮЧЕН! readyState:', this.socket?.readyState);
    }
  }

  onMessage(id: string, handler: (response: ServerResponse) => void): void {
    console.log('🎯 [WebSocketClient] onMessage() для ID:', id);
    this.messageHandlers.set(id, handler);
  }

  onEvent(eventType: string, handler: (data: unknown) => void): void {
    console.log('🎯 [WebSocketClient] onEvent() для события:', eventType);
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)?.push(handler);
  }

  removeEvent(eventType: string, handler: (data: unknown) => void): void {
    console.log('🎯 [WebSocketClient] removeEvent() для события:', eventType);
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitEvent(eventType: string, data: unknown): void {
    console.log('🎯 [WebSocketClient] emitEvent() событие:', eventType);
    console.log('🎯 [WebSocketClient] Данные события:', data);

    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      console.log('🎯 [WebSocketClient] Найдено обработчиков:', handlers.length);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error('❌ [WebSocketClient] Ошибка в обработчике события:', error);
        }
      });
    } else {
      console.log('🎯 [WebSocketClient] Нет обработчиков для события:', eventType);
    }
  }

  disconnect(): void {
    console.log('🔌 [WebSocketClient] disconnect() вызван');
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}