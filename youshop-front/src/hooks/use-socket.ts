'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth-store';
import { connectSocket, disconnectSocket, NotificationPayload } from '@/lib/socket';
import { toast } from 'sonner';

type EventHandler = (payload: NotificationPayload) => void;

export function useSocket() {
  const { accessToken, isAuthenticated } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Map<string, EventHandler[]>>(new Map());

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketRef.current = connectSocket(accessToken);

      socketRef.current.on('connected', (data) => {
        console.log('Socket connected:', data);
      });

      socketRef.current.on('payment:success', (payload: NotificationPayload) => {
        toast.success(payload.title, { description: payload.message });
        handlersRef.current.get('payment:success')?.forEach((handler) => handler(payload));
      });

      socketRef.current.on('payment:failed', (payload: NotificationPayload) => {
        toast.error(payload.title, { description: payload.message });
        handlersRef.current.get('payment:failed')?.forEach((handler) => handler(payload));
      });

      socketRef.current.on('order:status', (payload: NotificationPayload) => {
        toast.info(payload.title, { description: payload.message });
        handlersRef.current.get('order:status')?.forEach((handler) => handler(payload));
      });

      socketRef.current.on('stock:low', (payload: NotificationPayload) => {
        toast.warning(payload.title, { description: payload.message });
        handlersRef.current.get('stock:low')?.forEach((handler) => handler(payload));
      });

      socketRef.current.on('stock:out', (payload: NotificationPayload) => {
        toast.error(payload.title, { description: payload.message });
        handlersRef.current.get('stock:out')?.forEach((handler) => handler(payload));
      });

      return () => {
        disconnectSocket();
      };
    }
  }, [isAuthenticated, accessToken]);

  const subscribe = useCallback((channel: string) => {
    socketRef.current?.emit('subscribe', { channel });
  }, []);

  const unsubscribe = useCallback((channel: string) => {
    socketRef.current?.emit('unsubscribe', { channel });
  }, []);

  const on = useCallback((event: string, handler: EventHandler) => {
    const handlers = handlersRef.current.get(event) || [];
    handlers.push(handler);
    handlersRef.current.set(event, handlers);

    return () => {
      const handlers = handlersRef.current.get(event) || [];
      handlersRef.current.set(
        event,
        handlers.filter((h) => h !== handler)
      );
    };
  }, []);

  return {
    socket: socketRef.current,
    subscribe,
    unsubscribe,
    on,
  };
}
