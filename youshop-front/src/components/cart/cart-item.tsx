'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuantitySelector } from './quantity-selector';
import { CartItem as CartItemType } from '@/stores/cart-store';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

export function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { product, quantity } = item;
  const availableStock = product.inventory
    ? product.inventory.quantity - product.inventory.reserved
    : Infinity;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <div className="flex gap-4 py-4">
      {/* Image */}
      <Link href={`/products/${product.id}`} className="flex-shrink-0">
        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              Pas d&apos;image
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link
          href={`/products/${product.id}`}
          className="font-medium hover:text-primary transition-colors line-clamp-2"
        >
          {product.name}
        </Link>
        <p className="text-sm text-muted-foreground mt-1">
          {formatPrice(product.price)} / unité
        </p>

        <div className="flex items-center justify-between mt-2">
          <QuantitySelector
            quantity={quantity}
            maxQuantity={availableStock}
            onIncrease={() => onUpdateQuantity(quantity + 1)}
            onDecrease={() => onUpdateQuantity(quantity - 1)}
            size="sm"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Total */}
      <div className="text-right">
        <p className="font-semibold">{formatPrice(product.price * quantity)}</p>
      </div>
    </div>
  );
}
