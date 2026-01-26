'use client';

import { io, Socket } from 'socket.io-client';
import { WS_URL } from './constants';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket) {
    socket = io(`${WS_URL}/notifications`, {
      autoConnect: false,
      auth: token ? { token } : undefined,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (token: string): Socket => {
  const socket = getSocket(token);
  socket.auth = { token };
  socket.connect();
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export interface NotificationPayload {
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export type NotificationHandler = (payload: NotificationPayload) => void;
