'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { ProductGallery } from '@/components/products/product-gallery';
import { ProductDetails } from '@/components/products/product-details';
import { ProductGrid } from '@/components/products/product-grid';
import { Loading } from '@/components/shared/loading';
import { productsApi } from '@/lib/api';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id),
  });

  const { data: relatedProducts } = useQuery({
    queryKey: ['products', { categoryId: product?.categoryId, limit: 4 }],
    queryFn: () =>
      productsApi.getProducts({
        categoryId: product?.categoryId,
        limit: 4,
      }),
    enabled: !!product?.categoryId,
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement du produit..." />;
  }

  if (error || !product) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <p className="text-muted-foreground mb-8">
          Le produit que vous recherchez n&apos;existe pas ou a été supprimé.
        </p>
        <Link href="/products" className="text-primary hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const images = product.imageUrl ? [product.imageUrl] : [];

  // Filter out current product from related
  const filteredRelated =
    relatedProducts?.data.filter((p) => p.id !== product.id).slice(0, 4) || [];

  return (
    <div className="container py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-primary">
          Accueil
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href="/products" className="hover:text-primary">
          Catalogue
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link
              href={`/products?categoryId=${product.categoryId}`}
              className="hover:text-primary"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product */}
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
        <ProductGallery images={images} productName={product.name} />
        <ProductDetails product={product} />
      </div>

      {/* Related Products */}
      {filteredRelated.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6">Produits similaires</h2>
          <ProductGrid products={filteredRelated} />
        </section>
      )}
    </div>
  );
}
