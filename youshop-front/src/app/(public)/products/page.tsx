'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProductGrid } from '@/components/products/product-grid';
import { ProductFilters } from '@/components/products/product-filters';
import { ProductSearch } from '@/components/products/product-search';
import { Pagination } from '@/components/shared/pagination';
import { Loading } from '@/components/shared/loading';
import { productsApi } from '@/lib/api';
import { ProductFilters as ProductFiltersType } from '@/types';

function ProductsContent() {
  const searchParams = useSearchParams();

  const filters: ProductFiltersType = {
    page: Number(searchParams.get('page')) || 1,
    limit: 12,
    search: searchParams.get('search') || undefined,
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice')
      ? Number(searchParams.get('minPrice'))
      : undefined,
    maxPrice: searchParams.get('maxPrice')
      ? Number(searchParams.get('maxPrice'))
      : undefined,
    sortBy: (searchParams.get('sortBy') as ProductFiltersType['sortBy']) || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as ProductFiltersType['sortOrder']) || 'desc',
    inStock: searchParams.get('inStock') === 'true' || undefined,
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getProducts(filters),
  });

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    window.history.pushState(null, '', `?${params.toString()}`);
    refetch();
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Catalogue</h1>
        <p className="text-muted-foreground">
          {data?.meta.total || 0} produit{(data?.meta.total || 0) > 1 ? 's' : ''} disponible{(data?.meta.total || 0) > 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="lg:sticky lg:top-20">
            <div className="mb-4 lg:hidden">
              <ProductSearch />
            </div>
            <ProductFilters onFiltersChange={() => refetch()} />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="hidden lg:block mb-6">
            <ProductSearch />
          </div>

          <ProductGrid products={data?.data || []} isLoading={isLoading} />

          {data && data.meta.totalPages > 1 && (
            <div className="mt-8">
              <Pagination
                currentPage={data.meta.page}
                totalPages={data.meta.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading fullScreen text="Chargement du catalogue..." />}>
      <ProductsContent />
    </Suspense>
  );
}
