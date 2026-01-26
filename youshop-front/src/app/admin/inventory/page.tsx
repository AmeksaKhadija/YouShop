'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loading } from '@/components/shared/loading';
import { inventoryApi, InventoryWithProduct } from '@/lib/api/inventory';
import { toast } from 'sonner';

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<InventoryWithProduct | null>(null);
  const [adjustValue, setAdjustValue] = useState('');

  const { data: lowStock, isLoading: lowStockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: inventoryApi.getLowStock,
  });

  const { data: outOfStock, isLoading: outOfStockLoading } = useQuery({
    queryKey: ['out-of-stock'],
    queryFn: inventoryApi.getOutOfStock,
  });

  const adjustMutation = useMutation({
    mutationFn: ({ sku, adjustment }: { sku: string; adjustment: number }) =>
      inventoryApi.adjustStock(sku, adjustment),
    onSuccess: () => {
      toast.success('Stock ajusté');
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      queryClient.invalidateQueries({ queryKey: ['out-of-stock'] });
      setSelectedItem(null);
      setAdjustValue('');
    },
    onError: () => {
      toast.error("Erreur lors de l'ajustement");
    },
  });

  const handleAdjust = () => {
    if (!selectedItem || !adjustValue) return;
    const adjustment = parseInt(adjustValue);
    if (isNaN(adjustment)) {
      toast.error('Valeur invalide');
      return;
    }
    adjustMutation.mutate({ sku: selectedItem.sku, adjustment });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const isLoading = lowStockLoading || outOfStockLoading;

  if (isLoading) {
    return <Loading fullScreen text="Chargement des stocks..." />;
  }

  const InventoryTable = ({ items }: { items: InventoryWithProduct[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Produit</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead className="text-center">Stock</TableHead>
          <TableHead className="text-center">Réservé</TableHead>
          <TableHead className="text-center">Disponible</TableHead>
          <TableHead className="text-center">Seuil alerte</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
              Aucun produit
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => {
            const available = item.quantity - item.reserved;
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded bg-muted overflow-hidden">
                      {item.product.imageUrl ? (
                        <Image
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.product.price)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-center">{item.reserved}</TableCell>
                <TableCell className="text-center">
                  {available <= 0 ? (
                    <Badge variant="destructive">0</Badge>
                  ) : available <= item.lowStockAlert ? (
                    <Badge variant="secondary">{available}</Badge>
                  ) : (
                    <span>{available}</span>
                  )}
                </TableCell>
                <TableCell className="text-center">{item.lowStockAlert}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedItem(item)}
                  >
                    Ajuster
                  </Button>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des stocks</h1>
        <p className="text-muted-foreground">
          Surveillez et ajustez les niveaux de stock
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Stock faible</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{lowStock?.length || 0}</p>
            <p className="text-sm text-muted-foreground">
              Produits à réapprovisionner
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Package className="h-5 w-5 text-red-500" />
            <CardTitle className="text-lg">Rupture de stock</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{outOfStock?.length || 0}</p>
            <p className="text-sm text-muted-foreground">Produits indisponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <Tabs defaultValue="low">
        <TabsList>
          <TabsTrigger value="low">
            Stock faible ({lowStock?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="out">
            Rupture ({outOfStock?.length || 0})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="low" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <InventoryTable items={lowStock || []} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="out" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <InventoryTable items={outOfStock || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Adjust Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajuster le stock</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 py-4">
              <div>
                <p className="font-medium">{selectedItem.product.name}</p>
                <p className="text-sm text-muted-foreground">
                  SKU: {selectedItem.sku}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm">
                  Stock actuel: <span className="font-medium">{selectedItem.quantity}</span>
                </p>
                <p className="text-sm">
                  Réservé: <span className="font-medium">{selectedItem.reserved}</span>
                </p>
                <p className="text-sm">
                  Disponible:{' '}
                  <span className="font-medium">
                    {selectedItem.quantity - selectedItem.reserved}
                  </span>
                </p>
              </div>
              <div className="space-y-2">
                <Label>Ajustement (positif ou négatif)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 10 ou -5"
                  value={adjustValue}
                  onChange={(e) => setAdjustValue(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleAdjust}
              disabled={!adjustValue || adjustMutation.isPending}
            >
              Appliquer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
