import apiClient from './client';
import {
  Product,
  Category,
  ProductFilters,
  CreateProductData,
  UpdateProductData,
  CreateCategoryData,
  UpdateCategoryData,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const productsApi = {
  // Products
  getProducts: async (filters?: ProductFilters): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>('/catalog/products', {
      params: filters,
    });
    return data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<ApiResponse<Product>>(`/catalog/products/${id}`);
    return data.data;
  },

  createProduct: async (productData: CreateProductData): Promise<Product> => {
    const { data } = await apiClient.post<ApiResponse<Product>>('/catalog/products', productData);
    return data.data;
  },

  updateProduct: async (id: string, productData: UpdateProductData): Promise<Product> => {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/catalog/products/${id}`, productData);
    return data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/catalog/products/${id}`);
  },

  // Categories
  getCategories: async (): Promise<Category[]> => {
    const { data } = await apiClient.get<ApiResponse<Category[]>>('/catalog/categories');
    return data.data;
  },

  getCategory: async (id: string): Promise<Category> => {
    const { data } = await apiClient.get<ApiResponse<Category>>(`/catalog/categories/${id}`);
    return data.data;
  },

  createCategory: async (categoryData: CreateCategoryData): Promise<Category> => {
    const { data } = await apiClient.post<ApiResponse<Category>>('/catalog/categories', categoryData);
    return data.data;
  },

  updateCategory: async (id: string, categoryData: UpdateCategoryData): Promise<Category> => {
    const { data } = await apiClient.put<ApiResponse<Category>>(`/catalog/categories/${id}`, categoryData);
    return data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/catalog/categories/${id}`);
  },
};
