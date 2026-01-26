'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Product } from '@/types';
import { useCart } from '@/hooks/use-cart';

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  const availableStock = product.inventory
    ? product.inventory.quantity - product.inventory.reserved
    : 0;
  const isOutOfStock = availableStock <= 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    setQuantity(1);
  };

  const incrementQuantity = () => {
    if (quantity < availableStock) {
      setQuantity((q) => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((q) => q - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Badge */}
      {product.category && (
        <Badge variant="secondary">{product.category.name}</Badge>
      )}

      {/* Title */}
      <h1 className="text-3xl font-bold">{product.name}</h1>

      {/* Price */}
      <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>

      {/* Stock Status */}
      <div className="flex items-center gap-2">
        {isOutOfStock ? (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Rupture de stock
          </Badge>
        ) : isLowStock ? (
          <Badge variant="secondary" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Plus que {availableStock} en stock
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
            <Check className="h-3 w-3" />
            En stock ({availableStock} disponibles)
          </Badge>
        )}
      </div>

      <Separator />

      {/* Description */}
      {product.description && (
        <div>
          <h2 className="font-semibold mb-2">Description</h2>
          <p className="text-muted-foreground whitespace-pre-line">{product.description}</p>
        </div>
      )}

      <Separator />

      {/* Quantity Selector */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <span className="font-medium">Quantité:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={decrementQuantity}
              disabled={quantity <= 1 || isOutOfStock}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={incrementQuantity}
              disabled={quantity >= availableStock || isOutOfStock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleAddToCart}
          disabled={isOutOfStock}
        >
          <ShoppingCart className="mr-2 h-5 w-5" />
          {isOutOfStock ? 'Indisponible' : `Ajouter au panier - ${formatPrice(product.price * quantity)}`}
        </Button>
      </div>

      {/* SKU */}
      {product.inventory?.sku && (
        <p className="text-sm text-muted-foreground">
          SKU: {product.inventory.sku}
        </p>
      )}
    </div>
  );
}
