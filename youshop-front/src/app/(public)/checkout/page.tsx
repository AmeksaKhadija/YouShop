'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OrderSummary } from '@/components/checkout/order-summary';
import { CheckoutForm } from '@/components/checkout/checkout-form';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { items, subtotal, tax, total, isEmpty } = useCart();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (isEmpty) {
      router.push('/cart');
    }
  }, [isEmpty, router]);

  if (!isAuthenticated || isEmpty) {
    return null;
  }

  return (
    <div className="container py-8">
      <Button variant="ghost" className="mb-6" asChild>
        <Link href="/cart">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour au panier
        </Link>
      </Button>

      <h1 className="text-3xl font-bold mb-8">Finaliser la commande</h1>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Order Summary */}
        <div className="lg:order-2">
          <OrderSummary items={items} subtotal={subtotal} tax={tax} total={total} />
        </div>

        {/* Checkout Form */}
        <div className="lg:order-1">
          <CheckoutForm />
        </div>
      </div>
    </div>
  );
}
