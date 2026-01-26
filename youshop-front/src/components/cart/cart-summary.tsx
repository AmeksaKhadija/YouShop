'use client';

import { Separator } from '@/components/ui/separator';

interface CartSummaryProps {
  subtotal: number;
  tax: number;
  total: number;
}

export function CartSummary({ subtotal, tax, total }: CartSummaryProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Sous-total</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">TVA (20%)</span>
        <span>{formatPrice(tax)}</span>
      </div>
      <Separator />
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span>{formatPrice(total)}</span>
      </div>
    </div>
  );
}
