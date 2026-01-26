'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductForm } from '@/components/admin/product-form';
import { productsApi } from '@/lib/api';
import { CreateProductFormData } from '@/validations';
import { toast } from 'sonner';

export default function NewProductPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateProductFormData) =>
      productsApi.createProduct({
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl || undefined,
        categoryId: data.categoryId,
        sku: data.sku,
        initialStock: data.initialStock,
      }),
    onSuccess: () => {
      toast.success('Produit créé avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      router.push('/admin/products');
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

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
          <CardTitle>Nouveau produit</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            onSubmit={(data) => createMutation.mutate(data)}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
