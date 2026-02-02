export interface User {
  login: string;
  isLogined: boolean;
}

export interface MessageStatus {
  isDelivered: boolean;
  isReaded: boolean;
  isEdited: boolean;
  isDeleted?: boolean;
}

export interface Message {
  id: string;
  from: string;
  to: string;
  text: string;
  datetime: number;
  status: MessageStatus;
}

export interface ServerRequest {
  id: string | null;
  type: string;
  payload: unknown;
}

export interface ServerResponse {
  id: string | null;
  type: string;
  payload: unknown;
}

export interface LoginRequest {
  user: {
    login: string;
    password: string;
  };
}

export interface LoginResponse {
  user: User;
}

export interface SendMessageRequest {
  message: {
    to: string;
    text: string;
  };
}

export interface DeleteMessageRequest {
  message: {
    id: string;
  };
}

export interface EditMessageRequest {
  message: {
    id: string;
    text: string;
  };
}
