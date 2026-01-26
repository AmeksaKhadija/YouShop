'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatus } from './order-status';
import { Order } from '@/types';

interface OrderCardProps {
  order: Order;
  isAdmin?: boolean;
}

export function OrderCard({ order, isAdmin }: OrderCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr });
  };

  const detailUrl = isAdmin ? `/admin/orders/${order.id}` : `/orders/${order.id}`;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Order Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{order.orderNumber}</span>
              <OrderStatus status={order.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(order.createdAt)}
            </p>
            {isAdmin && order.user && (
              <p className="text-sm text-muted-foreground">
                Client: {order.user.firstName} {order.user.lastName}
              </p>
            )}
          </div>

          {/* Items Preview */}
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {order.items.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-background bg-muted"
                >
                  {item.product?.imageUrl ? (
                    <Image
                      src={item.product.imageUrl}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs">
                      ?
                    </div>
                  )}
                </div>
              ))}
              {order.items.length > 3 && (
                <div className="w-10 h-10 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{order.items.length - 3}
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground">
              {order.items.length} article{order.items.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Total & Action */}
          <div className="flex items-center gap-4">
            <span className="font-semibold text-lg">
              {formatPrice(order.totalAmount)}
            </span>
            <Button variant="ghost" size="sm" asChild>
              <Link href={detailUrl}>
                Détails
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
