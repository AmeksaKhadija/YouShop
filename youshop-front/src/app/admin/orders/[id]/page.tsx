'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrderStatus } from '@/components/orders/order-status';
import { OrderTimeline } from '@/components/orders/order-timeline';
import { Loading } from '@/components/shared/loading';
import { ordersApi } from '@/lib/api';
import { OrderStatus as OrderStatusType } from '@/types';
import { ORDER_STATUS_LABELS } from '@/lib/constants';
import { toast } from 'sonner';

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: () => ordersApi.getOrder(id),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: OrderStatusType) => ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Statut mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-order', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement de la commande..." />;
  }

  if (error || !order) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Commande non trouvée</h1>
        <Button asChild>
          <Link href="/admin/orders">Retour aux commandes</Link>
        </Button>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy à HH:mm', { locale: fr });
  };

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/admin/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commandes
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatus status={order.status} />
          <Select
            value={order.status}
            onValueChange={(value) =>
              updateStatusMutation.mutate(value as OrderStatusType)
            }
            disabled={updateStatusMutation.isPending}
          >
            <SelectTrigger className="w-[200px]">
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations client</CardTitle>
            </CardHeader>
            <CardContent>
              {order.user ? (
                <div className="space-y-2">
                  <p>
                    <span className="text-muted-foreground">Nom:</span>{' '}
                    {order.user.firstName} {order.user.lastName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Email:</span>{' '}
                    {order.user.email}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">Informations non disponibles</p>
              )}
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Articles commandés</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-right">Prix unitaire</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded bg-muted overflow-hidden">
                            {item.product?.imageUrl ? (
                              <Image
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs">
                                N/A
                              </div>
                            )}
                          </div>
                          <span className="font-medium">
                            {item.product?.name || 'Produit supprimé'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPrice(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">TVA (20%)</span>
                  <span>{formatPrice(order.taxAmount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderTimeline
                status={order.status}
                createdAt={order.createdAt}
                paidAt={order.paidAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
