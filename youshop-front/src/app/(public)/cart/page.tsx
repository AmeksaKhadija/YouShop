'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/components/cart/cart-item';
import { CartSummary } from '@/components/cart/cart-summary';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
    isEmpty,
  } = useCart();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  if (isEmpty) {
    return (
      <div className="container py-16 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto mb-6 text-muted-foreground" />
        <h1 className="text-2xl font-bold mb-2">Votre panier est vide</h1>
        <p className="text-muted-foreground mb-8">
          Découvrez notre catalogue et ajoutez des produits à votre panier.
        </p>
        <Button asChild>
          <Link href="/products">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continuer mes achats
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Mon panier</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>
                {items.length} article{items.length > 1 ? 's' : ''}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={clearCart}>
                Vider le panier
              </Button>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {items.map((item) => (
                  <CartItem
                    key={item.product.id}
                    item={item}
                    onUpdateQuantity={(qty) => updateQuantity(item.product.id, qty)}
                    onRemove={() => removeItem(item.product.id)}
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" asChild>
                <Link href="/products">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continuer mes achats
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Récapitulatif</CardTitle>
            </CardHeader>
            <CardContent>
              <CartSummary subtotal={subtotal} tax={tax} total={total} />
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleCheckout}>
                Passer la commande
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
