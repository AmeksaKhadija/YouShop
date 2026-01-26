'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isAdmin } = useAuth();
  useSocket(); // Initialize socket for admin notifications

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/admin');
    } else if (!isAdmin) {
      router.push('/');
    }
  }, [isAuthenticated, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 pb-16 lg:pb-0">
        <div className="container py-6">{children}</div>
      </div>
      <MobileNav />
    </div>
  );
}
