import apiClient from './client';
import { Inventory, ApiResponse } from '@/types';

export interface InventoryWithProduct extends Inventory {
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

export const inventoryApi = {
  getInventoryBySku: async (sku: string): Promise<Inventory> => {
    const { data } = await apiClient.get<ApiResponse<Inventory>>(`/inventory/sku/${sku}`);
    return data.data;
  },

  updateStock: async (sku: string, quantity: number): Promise<Inventory> => {
    const { data } = await apiClient.put<ApiResponse<Inventory>>(`/inventory/sku/${sku}`, {
      quantity,
    });
    return data.data;
  },

  adjustStock: async (sku: string, adjustment: number): Promise<Inventory> => {
    const { data } = await apiClient.patch<ApiResponse<Inventory>>(`/inventory/sku/${sku}/adjust`, {
      adjustment,
    });
    return data.data;
  },

  setStockAlert: async (sku: string, lowStockAlert: number): Promise<Inventory> => {
    const { data } = await apiClient.patch<ApiResponse<Inventory>>(`/inventory/sku/${sku}/alert`, {
      lowStockAlert,
    });
    return data.data;
  },

  getLowStock: async (): Promise<InventoryWithProduct[]> => {
    const { data } = await apiClient.get<ApiResponse<InventoryWithProduct[]>>('/inventory/low-stock');
    return data.data;
  },

  getOutOfStock: async (): Promise<InventoryWithProduct[]> => {
    const { data } = await apiClient.get<ApiResponse<InventoryWithProduct[]>>('/inventory/out-of-stock');
    return data.data;
  },
};
