'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types';
import { useCart } from '@/hooks/use-cart';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const availableStock = product.inventory
    ? product.inventory.quantity - product.inventory.reserved
    : 0;
  const isOutOfStock = availableStock <= 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  return (
    <Card className="group overflow-hidden h-full flex flex-col">
      <Link href={`/products/${product.id}`} className="relative aspect-square overflow-hidden">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Pas d&apos;image</span>
          </div>
        )}
        {isOutOfStock && (
          <Badge variant="destructive" className="absolute top-2 right-2">
            Rupture de stock
          </Badge>
        )}
        {availableStock > 0 && availableStock <= 5 && (
          <Badge variant="secondary" className="absolute top-2 right-2">
            Plus que {availableStock} !
          </Badge>
        )}
      </Link>
      <CardContent className="flex-1 p-4">
        <Link href={`/products/${product.id}`}>
          <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.category && (
          <p className="text-sm text-muted-foreground mt-1">{product.category.name}</p>
        )}
        <p className="text-lg font-bold mt-2 text-primary">{formatPrice(product.price)}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={() => addItem(product)}
          disabled={isOutOfStock}
          className="w-full"
          variant={isOutOfStock ? 'secondary' : 'default'}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {isOutOfStock ? 'Indisponible' : 'Ajouter au panier'}
        </Button>
      </CardFooter>
    </Card>
  );
}
