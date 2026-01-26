'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
import { useAuth } from '@/hooks/use-auth';
import { ordersApi } from '@/lib/api';
import { toast } from 'sonner';

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isAuthenticated, router]);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => ordersApi.getMyOrder(id),
    enabled: isAuthenticated,
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancelOrder(id),
    onSuccess: () => {
      toast.success('Commande annulée');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: () => {
      toast.error("Impossible d'annuler la commande");
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <Loading fullScreen text="Chargement de la commande..." />;
  }

  if (error || !order) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Commande non trouvée</h1>
        <Button asChild>
          <Link href="/orders">Retour aux commandes</Link>
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

  const canCancel = order.status === 'PENDING';

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux commandes
        </Link>
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-4">
          <OrderStatus status={order.status} />
          {canCancel && (
            <Button
              variant="destructive"
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Annuler
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="text-green-600">Gratuite</span>
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
              <CardTitle>Suivi de commande</CardTitle>
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
