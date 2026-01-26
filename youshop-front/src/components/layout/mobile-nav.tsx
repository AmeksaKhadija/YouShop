'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { title: 'Produits', href: '/admin/products', icon: Package },
  { title: 'Commandes', href: '/admin/orders', icon: ShoppingCart },
  { title: 'Inventaire', href: '/admin/inventory', icon: Warehouse },
  { title: 'Paiements', href: '/admin/payments', icon: CreditCard },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="flex items-center justify-around py-2">
        {navLinks.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== '/admin' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="h-5 w-5" />
              <span>{link.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
