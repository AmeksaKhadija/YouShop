'use client';

import { useQuery } from '@tanstack/react-query';
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
} from 'lucide-react';
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { RevenueChart } from '@/components/admin/revenue-chart';
import { RecentOrders } from '@/components/admin/recent-orders';
import { NotificationsFeed } from '@/components/admin/notifications-feed';
import { Loading } from '@/components/shared/loading';
import { ordersApi, inventoryApi } from '@/lib/api';

export default function AdminDashboardPage() {
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders', { limit: 10 }],
    queryFn: () => ordersApi.getAllOrders({ limit: 10 }),
  });

  const { data: lowStockData } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryApi.getLowStock,
  });

  const { data: outOfStockData } = useQuery({
    queryKey: ['out-of-stock'],
    queryFn: inventoryApi.getOutOfStock,
  });

  // Calculate stats from orders data
  const todayOrders = ordersData?.data.filter((order) => {
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    return orderDate.toDateString() === today.toDateString();
  }) || [];

  const todayRevenue = todayOrders
    .filter((order) => order.status === 'PAID' || order.status === 'SHIPPED' || order.status === 'DELIVERED')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = ordersData?.data.filter(
    (order) => order.status === 'PENDING' || order.status === 'PAYMENT_PENDING'
  ).length || 0;

  const stats = [
    {
      title: "Ventes du jour",
      value: new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
      }).format(todayRevenue),
      icon: DollarSign,
      description: `${todayOrders.length} commande${todayOrders.length > 1 ? 's' : ''} aujourd'hui`,
    },
    {
      title: 'Commandes en attente',
      value: pendingOrders,
      icon: ShoppingCart,
      description: 'À traiter',
    },
    {
      title: 'Stock faible',
      value: lowStockData?.length || 0,
      icon: AlertTriangle,
      description: 'Produits à réapprovisionner',
    },
    {
      title: 'Rupture de stock',
      value: outOfStockData?.length || 0,
      icon: Package,
      description: 'Produits indisponibles',
    },
  ];

  // Generate mock revenue data for chart (in real app, this would come from API)
  const revenueData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }),
      revenue: Math.floor(Math.random() * 5000) + 1000,
      orders: Math.floor(Math.random() * 20) + 5,
    };
  });

  if (ordersLoading) {
    return <Loading fullScreen text="Chargement du tableau de bord..." />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground">
          Bienvenue dans l&apos;espace d&apos;administration YouShop
        </p>
      </div>

      {/* Stats */}
      <DashboardStats stats={stats} />

      {/* Charts and Recent Orders */}
      <div className="grid lg:grid-cols-2 gap-8">
        <RevenueChart data={revenueData} />
        <NotificationsFeed />
      </div>

      {/* Recent Orders */}
      <RecentOrders orders={ordersData?.data || []} />
    </div>
  );
}
