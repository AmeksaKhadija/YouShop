'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { Loading } from '@/components/shared/loading';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Clear cart after successful payment
    clearCart();
  }, [clearCart]);

  return (
    <div className="container py-16">
      <Card className="max-w-lg mx-auto text-center">
        <CardContent className="pt-8 pb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-6">
            <CheckCircle className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-bold mb-2">Commande confirmée !</h1>
          <p className="text-muted-foreground mb-8">
            Merci pour votre achat. Vous recevrez un email de confirmation avec les
            détails de votre commande.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              <span>Votre commande sera expédiée sous 24-48h</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/orders">
                Voir mes commandes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/products">Continuer mes achats</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Chargement..." />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
