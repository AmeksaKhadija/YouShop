'use client';

import { Badge } from '@/components/ui/badge';
import { OrderStatus as OrderStatusType } from '@/types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface OrderStatusProps {
  status: OrderStatusType;
}

export function OrderStatus({ status }: OrderStatusProps) {
  return (
    <Badge className={cn('font-medium', ORDER_STATUS_COLORS[status])}>
      {ORDER_STATUS_LABELS[status] || status}
    </Badge>
  );
}
