export interface User {
  login: string;
  password?: string;
  isLogined: boolean;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  datetime: number;
  status: {
    isDelivered: boolean;
    isReaded: boolean;
    isEdited: boolean;
    isDeleted: boolean;
  };
}

export enum WebSocketEvent {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  ERROR_RESPONSE = 'ERROR',
  USER_LOGIN = 'USER_LOGIN',
  USER_EXTERNAL_LOGIN = 'USER_EXTERNAL_LOGIN',
  USER_EXTERNAL_LOGOUT = 'USER_EXTERNAL_LOGOUT',
  USER_ACTIVE = 'USER_ACTIVE',
  USER_LOGOUT = 'USER_LOGOUT',
  MSG_SEND = 'MSG_SEND',
  MSG_FROM_USER = 'MSG_FROM_USER',
  MSG_DELIVER = 'MSG_DELIVER',
  MSG_READ = 'MSG_READ',
  MSG_EDIT = 'MSG_EDIT',
  MSG_DELETE = 'MSG_DELETE',
  MSG_COUNT_NOT_READED_FROM_USER = 'MSG_COUNT_NOT_READED_FROM_USER'
}

export interface UserLoginData {
  user: {
    login: string;
    isLogined: boolean;
  };
}

export interface ErrorData {
  error: string;
}

export interface UserActiveData {
  users: User[];
}

export interface MessageSendData {
  message: Message;
}

export interface MessageStatusData {
  message: {
    id: string;
  };
}

export interface MessageEditData {
  message: {
    id: string;
    text: string;
  };
}

export interface MessageDeleteData {
  message: {
    id: string;
  };
}

export interface MessageCountData {
  count: number;
}

export interface WebSocketRequestPayload {
  user?: { login: string; password?: string };
  message?: { id?: string; to?: string; text?: string };
}

export interface WebSocketRequest {
  id: string;
  type: WebSocketEvent;
  payload: WebSocketRequestPayload | null;
}

export interface ServerResponse {
  id?: string;
  type: WebSocketEvent;
  payload: unknown;
}