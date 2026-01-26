import apiClient from './client';
import {
  Order,
  OrderStatus,
  CreateOrderData,
  OrderFilters,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const ordersApi = {
  // Client endpoints
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const { data } = await apiClient.post<ApiResponse<Order>>('/orders', orderData);
    return data.data;
  },

  getMyOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders/my-orders', {
      params: filters,
    });
    return data;
  },

  getMyOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/my-orders/${id}`);
    return data.data;
  },

  cancelOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(`/orders/my-orders/${id}/cancel`);
    return data.data;
  },

  // Admin endpoints
  getAllOrders: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>('/orders', {
      params: filters,
    });
    return data;
  },

  getOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return data.data;
  },

  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const { data } = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status });
    return data.data;
  },

  processExpiredOrders: async (): Promise<void> => {
    await apiClient.post('/orders/process-expired');
  },
};
