'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/product-form';
import { Loading } from '@/components/shared/loading';
import { productsApi } from '@/lib/api';
import { CreateProductFormData } from '@/validations';
import { toast } from 'sonner';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getProduct(id),
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateProductFormData) =>
      productsApi.updateProduct(id, {
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl || undefined,
        categoryId: data.categoryId,
        sku: data.sku,
      }),
    onSuccess: () => {
      toast.success('Produit mis à jour');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      router.push('/admin/products');
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  if (isLoading) {
    return <Loading fullScreen text="Chargement du produit..." />;
  }

  if (!product) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Produit non trouvé</h1>
        <Button asChild>
          <Link href="/admin/products">Retour aux produits</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" asChild>
        <Link href="/admin/products">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux produits
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Modifier le produit</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={product}
            onSubmit={(data) => updateMutation.mutate(data)}
            isSubmitting={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
