'use client';

import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CreditCard, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loading } from '@/components/shared/loading';
import { paymentsApi } from '@/lib/api';
import { PAYMENT_STATUS_LABELS } from '@/lib/constants';
import { PaymentStatus } from '@/types';

const statusColors: Record<PaymentStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SUCCEEDED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

export default function AdminPaymentsPage() {
  const { data: paymentsData, isLoading } = useQuery({
    queryKey: ['payment-history'],
    queryFn: paymentsApi.getPaymentHistory,
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement des paiements..." />;
  }

  const payments = paymentsData?.data || [];

  const todayPayments = payments.filter((payment) => {
    const paymentDate = new Date(payment.createdAt);
    const today = new Date();
    return paymentDate.toDateString() === today.toDateString();
  });

  const todayRevenue = todayPayments
    .filter((p) => p.status === 'SUCCEEDED')
    .reduce((sum, p) => sum + p.amount, 0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: fr });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Paiements</h1>
        <p className="text-muted-foreground">
          Historique des transactions
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <CardTitle className="text-lg">Chiffre d&apos;affaires du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatPrice(todayRevenue)}</p>
            <p className="text-sm text-muted-foreground">
              {todayPayments.filter((p) => p.status === 'SUCCEEDED').length} paiements réussis
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CreditCard className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-lg">Transactions du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{todayPayments.length}</p>
            <p className="text-sm text-muted-foreground">
              Total des transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des paiements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Transaction</TableHead>
                <TableHead>Commande</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun paiement
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono text-sm">
                      {payment.stripePaymentIntent || payment.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>{payment.orderId.slice(0, 8)}...</TableCell>
                    <TableCell>
                      <Badge className={statusColors[payment.status]}>
                        {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatPrice(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
