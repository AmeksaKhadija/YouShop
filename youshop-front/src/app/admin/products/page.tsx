'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DataTable, Column, Action } from '@/components/admin/data-table';
import { productsApi } from '@/lib/api';
import { Product } from '@/types';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', page, search],
    queryFn: () => productsApi.getProducts({ page, limit: 10, search: search || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.deleteProduct,
    onSuccess: () => {
      toast.success('Produit supprimé');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const columns: Column<Product>[] = [
    {
      key: 'image',
      header: 'Image',
      cell: (product) => (
        <div className="relative w-12 h-12 rounded bg-muted overflow-hidden">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
              N/A
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Nom',
      cell: (product) => (
        <div>
          <p className="font-medium">{product.name}</p>
          {product.inventory?.sku && (
            <p className="text-xs text-muted-foreground">SKU: {product.inventory.sku}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Catégorie',
      cell: (product) => product.category?.name || 'N/A',
    },
    {
      key: 'price',
      header: 'Prix',
      cell: (product) => formatPrice(product.price),
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (product) => {
        const stock = product.inventory?.quantity || 0;
        const reserved = product.inventory?.reserved || 0;
        const available = stock - reserved;

        if (available <= 0) {
          return <Badge variant="destructive">Rupture</Badge>;
        }
        if (available <= 5) {
          return <Badge variant="secondary">{available} dispo.</Badge>;
        }
        return <Badge variant="outline">{available} dispo.</Badge>;
      },
    },
    {
      key: 'status',
      header: 'Statut',
      cell: (product) =>
        product.isActive ? (
          <Badge variant="outline" className="text-green-600 border-green-600">
            Actif
          </Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        ),
    },
  ];

  const actions: Action<Product>[] = [
    {
      label: 'Modifier',
      icon: Pencil,
      onClick: (product) => router.push(`/admin/products/${product.id}/edit`),
    },
    {
      label: 'Supprimer',
      icon: Trash2,
      onClick: (product) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
          deleteMutation.mutate(product.id);
        }
      },
      variant: 'destructive',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground">
            Gérez votre catalogue de produits
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau produit
          </Link>
        </Button>
      </div>

      <DataTable
        data={data?.data || []}
        columns={columns}
        actions={actions}
        searchPlaceholder="Rechercher un produit..."
        onSearch={setSearch}
        onBulkDelete={(ids) => {
          if (confirm(`Supprimer ${ids.length} produit(s) ?`)) {
            ids.forEach((id) => deleteMutation.mutate(id));
          }
        }}
        isLoading={isLoading}
        pagination={{
          currentPage: data?.meta.page || 1,
          totalPages: data?.meta.totalPages || 1,
          onPageChange: setPage,
        }}
        getRowId={(product) => product.id}
      />
    </div>
  );
}
