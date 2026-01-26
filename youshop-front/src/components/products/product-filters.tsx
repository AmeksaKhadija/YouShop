'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { productsApi } from '@/lib/api';

interface ProductFiltersProps {
  onFiltersChange?: () => void;
}

export function ProductFilters({ onFiltersChange }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '');
  const [minPrice, setMinPrice] = useState(Number(searchParams.get('minPrice')) || 0);
  const [maxPrice, setMaxPrice] = useState(Number(searchParams.get('maxPrice')) || 1000);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdAt');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc');
  const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  const updateUrl = () => {
    const params = new URLSearchParams();

    if (categoryId) params.set('categoryId', categoryId);
    if (minPrice > 0) params.set('minPrice', String(minPrice));
    if (maxPrice < 1000) params.set('maxPrice', String(maxPrice));
    if (sortBy !== 'createdAt') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (inStock) params.set('inStock', 'true');

    const search = searchParams.get('search');
    if (search) params.set('search', search);

    router.push(`/products?${params.toString()}`);
    onFiltersChange?.();
  };

  const resetFilters = () => {
    setCategoryId('');
    setMinPrice(0);
    setMaxPrice(1000);
    setSortBy('createdAt');
    setSortOrder('desc');
    setInStock(false);

    const search = searchParams.get('search');
    router.push(search ? `/products?search=${search}` : '/products');
    onFiltersChange?.();
  };

  const hasActiveFilters = categoryId || minPrice > 0 || maxPrice < 1000 || inStock || sortBy !== 'createdAt';

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-2">
        <Label>Catégorie</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="Toutes les catégories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Toutes les catégories</SelectItem>
            {categories?.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-4">
        <Label>Prix: {minPrice}€ - {maxPrice}€</Label>
        <Slider
          value={[minPrice, maxPrice]}
          min={0}
          max={1000}
          step={10}
          onValueChange={([min, max]) => {
            setMinPrice(min);
            setMaxPrice(max);
          }}
        />
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label>Trier par</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Nouveautés</SelectItem>
            <SelectItem value="price">Prix</SelectItem>
            <SelectItem value="name">Nom</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Order */}
      <div className="space-y-2">
        <Label>Ordre</Label>
        <Select value={sortOrder} onValueChange={setSortOrder}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Croissant</SelectItem>
            <SelectItem value="desc">Décroissant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* In Stock */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="inStock"
          checked={inStock}
          onCheckedChange={(checked) => setInStock(checked as boolean)}
        />
        <Label htmlFor="inStock" className="cursor-pointer">
          En stock uniquement
        </Label>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button onClick={updateUrl} className="flex-1">
          Appliquer
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={resetFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Filter Button */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-2 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  !
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Filtres</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Filters */}
      <div className="hidden lg:block">
        <FilterContent />
      </div>
    </>
  );
}
