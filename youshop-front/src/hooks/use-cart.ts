'use client';

import { useCartStore, CartItem } from '@/stores/cart-store';
import { Product } from '@/types';
import { toast } from 'sonner';

export function useCart() {
  const {
    items,
    isOpen,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    getItemCount,
    getSubtotal,
    getTax,
    getTotal,
  } = useCartStore();

  const handleAddItem = (product: Product, quantity = 1) => {
    const availableStock = product.inventory
      ? product.inventory.quantity - product.inventory.reserved
      : Infinity;

    const currentItem = items.find((item) => item.product.id === product.id);
    const currentQty = currentItem?.quantity || 0;

    if (currentQty + quantity > availableStock) {
      toast.error(`Stock insuffisant. Disponible: ${availableStock}`);
      return;
    }

    addItem(product, quantity);
    toast.success(`${product.name} ajouté au panier`);
    openCart();
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const item = items.find((item) => item.product.id === productId);
    if (!item) return;

    const availableStock = item.product.inventory
      ? item.product.inventory.quantity - item.product.inventory.reserved
      : Infinity;

    if (quantity > availableStock) {
      toast.error(`Stock insuffisant. Disponible: ${availableStock}`);
      return;
    }

    updateQuantity(productId, quantity);
  };

  const handleRemoveItem = (productId: string) => {
    const item = items.find((item) => item.product.id === productId);
    removeItem(productId);
    if (item) {
      toast.success(`${item.product.name} retiré du panier`);
    }
  };

  return {
    items,
    isOpen,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    updateQuantity: handleUpdateQuantity,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    itemCount: getItemCount(),
    subtotal: getSubtotal(),
    tax: getTax(),
    total: getTotal(),
    isEmpty: items.length === 0,
  };
}

export type { CartItem };
