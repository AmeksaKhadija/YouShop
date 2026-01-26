'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Clock,
  CreditCard,
  CheckCircle,
  Truck,
  Package,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { OrderStatus } from '@/types';
import { cn } from '@/lib/utils';

interface TimelineEvent {
  status: OrderStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  date?: string;
}

interface OrderTimelineProps {
  status: OrderStatus;
  createdAt: string;
  paidAt?: string;
}

const statusOrder: OrderStatus[] = [
  'PENDING',
  'PAYMENT_PENDING',
  'PAID',
  'SHIPPED',
  'DELIVERED',
];

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  PENDING: { label: 'Commande créée', icon: Clock },
  PAYMENT_PENDING: { label: 'Paiement en cours', icon: CreditCard },
  PAID: { label: 'Payée', icon: CheckCircle },
  SHIPPED: { label: 'Expédiée', icon: Truck },
  DELIVERED: { label: 'Livrée', icon: Package },
  CANCELLED: { label: 'Annulée', icon: XCircle },
  PAYMENT_FAILED: { label: 'Paiement échoué', icon: AlertCircle },
};

export function OrderTimeline({ status, createdAt, paidAt }: OrderTimelineProps) {
  const isCancelled = status === 'CANCELLED' || status === 'PAYMENT_FAILED';

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
  };

  if (isCancelled) {
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <div className="flex items-center gap-3 text-destructive">
        <Icon className="h-5 w-5" />
        <span className="font-medium">{config.label}</span>
      </div>
    );
  }

  const currentIndex = statusOrder.indexOf(status);

  return (
    <div className="space-y-4">
      {statusOrder.map((s, index) => {
        const config = statusConfig[s];
        const Icon = config.icon;
        const isCompleted = index <= currentIndex;
        const isCurrent = s === status;

        let date: string | undefined;
        if (s === 'PENDING') date = createdAt;
        if (s === 'PAID' && paidAt) date = paidAt;

        return (
          <div key={s} className="flex items-start gap-3">
            <div
              className={cn(
                'flex items-center justify-center w-8 h-8 rounded-full',
                isCompleted ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p
                className={cn(
                  'font-medium',
                  isCompleted ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {config.label}
              </p>
              {date && (
                <p className="text-sm text-muted-foreground">{formatDate(date)}</p>
              )}
            </div>
            {isCurrent && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                En cours
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
