'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { OrderCard } from '@/components/orders/order-card';
import { Loading } from '@/components/shared/loading';
import { Pagination } from '@/components/shared/pagination';
import { useAuth } from '@/hooks/use-auth';
import { ordersApi } from '@/lib/api';
import { useState } from 'react';

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', page],
    queryFn: () => ordersApi.getMyOrders({ page, limit: 10 }),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return <Loading fullScreen text="Chargement des commandes..." />;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Mes commandes</h1>

      {data?.data.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Aucune commande</h2>
          <p className="text-muted-foreground">
            Vous n&apos;avez pas encore passé de commande.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data?.data.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}

          {data && data.meta.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
