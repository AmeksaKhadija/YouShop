'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCart } from '@/hooks/use-cart';
import { ordersApi, paymentsApi } from '@/lib/api';
import { toast } from 'sonner';

export function CheckoutForm() {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [error, setError] = useState<string | null>(null);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      // Create order
      const orderData = {
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };
      const order = await ordersApi.createOrder(orderData);

      // Create Stripe checkout session
      const checkout = await paymentsApi.createCheckout({ orderId: order.id });

      return { order, checkout };
    },
    onSuccess: ({ checkout }) => {
      // Redirect to Stripe checkout
      window.location.href = checkout.url;
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Erreur lors de la création de la commande';
      setError(message);
      toast.error(message);
    },
  });

  const handleSubmit = () => {
    setError(null);
    createOrderMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Paiement
        </CardTitle>
        <CardDescription>
          Vous allez être redirigé vers Stripe pour finaliser votre paiement en toute sécurité.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-green-600" />
          <span>Paiement sécurisé par Stripe</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createOrderMutation.isPending || items.length === 0}
          className="w-full"
          size="lg"
        >
          {createOrderMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              Payer maintenant
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          En cliquant sur "Payer maintenant", vous acceptez nos conditions générales de vente.
        </p>
      </CardContent>
    </Card>
  );
}
