'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, Column, Action } from '@/components/admin/data-table';
import { OrderStatus } from '@/components/orders/order-status';
import { ordersApi } from '@/lib/api';
import { Order, OrderStatus as OrderStatusType } from '@/types';
import { ORDER_STATUS_LABELS } from '@/lib/constants';

export default function AdminOrdersPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<OrderStatusType | ''>('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', page, statusFilter],
    queryFn: () =>
      ordersApi.getAllOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
      }),
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
  };

  const columns: Column<Order>[] = [
    {
      key: 'orderNumber',
      header: 'N° Commande',
      cell: (order) => (
        <Link
          href={`/admin/orders/${order.id}`}
          className="font-medium hover:text-primary"
        >
          {order.orderNumber}
        </Link>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      cell: (order) =>
        order.user
          ? `${order.user.firstName} ${order.user.lastName}`
          : 'N/A',
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (order) => <OrderStatus status={order.status} />,
    },
    {
      key: 'items',
      header: 'Articles',
      cell: (order) => `${order.items.length} article${order.items.length > 1 ? 's' : ''}`,
    },
    {
      key: 'total',
      header: 'Total',
      cell: (order) => formatPrice(order.totalAmount),
    },
    {
      key: 'date',
      header: 'Date',
      cell: (order) => formatDate(order.createdAt),
    },
  ];

  const actions: Action<Order>[] = [
    {
      label: 'Voir détails',
      icon: Eye,
      onClick: (order) => router.push(`/admin/orders/${order.id}`),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Commandes</h1>
          <p className="text-muted-foreground">
            Gérez les commandes de vos clients
          </p>
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as OrderStatusType | '')}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Tous les statuts</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        pagination={{
          currentPage: data?.meta.page || 1,
          totalPages: data?.meta.totalPages || 1,
          onPageChange: setPage,
        }}
        getRowId={(order) => order.id}
      />
    </div>
  );
}
