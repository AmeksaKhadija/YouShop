export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  sku: string;
  quantity: number;
  reserved: number;
  lowStockAlert: number;
  productId: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category?: Category;
  inventory?: Inventory;
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'name' | 'price' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  inStock?: boolean;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  categoryId: string;
  sku?: string;
  initialStock?: number;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  categoryId?: string;
  sku?: string;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}
