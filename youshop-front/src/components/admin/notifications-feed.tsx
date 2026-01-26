'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Bell,
  CreditCard,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/hooks/use-socket';
import { NotificationPayload } from '@/lib/socket';
import { cn } from '@/lib/utils';

interface Notification extends NotificationPayload {
  id: string;
  read: boolean;
}

const typeConfig: Record<
  string,
  { icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  PAYMENT_SUCCESS: { icon: CheckCircle, color: 'text-green-500' },
  PAYMENT_FAILED: { icon: XCircle, color: 'text-red-500' },
  ORDER_STATUS: { icon: Package, color: 'text-blue-500' },
  STOCK_LOW: { icon: AlertTriangle, color: 'text-yellow-500' },
  STOCK_OUT: { icon: AlertTriangle, color: 'text-red-500' },
};

export function NotificationsFeed() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { on } = useSocket();

  useEffect(() => {
    const events = [
      'payment:success',
      'payment:failed',
      'order:status',
      'stock:low',
      'stock:out',
    ];

    const unsubscribes = events.map((event) =>
      on(event, (payload) => {
        const notification: Notification = {
          ...payload,
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          read: false,
        };
        setNotifications((prev) => [notification, ...prev].slice(0, 50));
      })
    );

    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [on]);

  const formatDate = (date: string) => {
    return format(new Date(date), 'HH:mm', { locale: fr });
  };

  const getConfig = (type: string) => {
    return typeConfig[type] || { icon: Bell, color: 'text-muted-foreground' };
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
        {notifications.filter((n) => !n.read).length > 0 && (
          <Badge variant="destructive">
            {notifications.filter((n) => !n.read).length} nouvelles
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Bell className="h-8 w-8 mb-2" />
              <p>Aucune notification</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => {
                const config = getConfig(notification.type);
                const Icon = config.icon;

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 p-3 rounded-lg transition-colors',
                      !notification.read ? 'bg-muted/50' : ''
                    )}
                  >
                    <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
