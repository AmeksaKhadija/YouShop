'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from './cart-item';
import { CartSummary } from './cart-summary';
import { useCart } from '@/hooks/use-cart';
import { useAuth } from '@/hooks/use-auth';

export function CartDrawer() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    subtotal,
    tax,
    total,
    isEmpty,
  } = useCart();

  const handleCheckout = () => {
    closeCart();
    if (!isAuthenticated) {
      router.push('/login?redirect=/checkout');
    } else {
      router.push('/checkout');
    }
  };

  const handleViewCart = () => {
    closeCart();
    router.push('/cart');
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Panier ({items.length} article{items.length > 1 ? 's' : ''})
          </SheetTitle>
        </SheetHeader>

        {isEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <ShoppingCart className="h-16 w-16 text-muted-foreground" />
            <p className="text-muted-foreground">Votre panier est vide</p>
            <Button variant="outline" onClick={() => {
              closeCart();
              router.push('/products');
            }}>
              Continuer mes achats
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
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
            </ScrollArea>

            <div className="space-y-4 pt-4">
              <Separator />
              <CartSummary subtotal={subtotal} tax={tax} total={total} />
              <div className="grid gap-2">
                <Button onClick={handleCheckout}>
                  Passer la commande
                </Button>
                <Button variant="outline" onClick={handleViewCart}>
                  Voir le panier
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
