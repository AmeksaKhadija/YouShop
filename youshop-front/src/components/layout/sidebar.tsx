'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Warehouse,
  CreditCard,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Produits',
    href: '/admin/products',
    icon: Package,
  },
  {
    title: 'Commandes',
    href: '/admin/orders',
    icon: ShoppingCart,
  },
  {
    title: 'Inventaire',
    href: '/admin/inventory',
    icon: Warehouse,
  },
  {
    title: 'Paiements',
    href: '/admin/payments',
    icon: CreditCard,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-muted/30 min-h-[calc(100vh-4rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href ||
            (link.href !== '/admin' && pathname.startsWith(link.href));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
