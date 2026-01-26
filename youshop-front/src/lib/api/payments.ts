import apiClient from './client';
import { Payment, CheckoutSession, CreateCheckoutData, ApiResponse, PaginatedResponse } from '@/types';

export const paymentsApi = {
  createCheckout: async (checkoutData: CreateCheckoutData): Promise<CheckoutSession> => {
    const { data } = await apiClient.post<ApiResponse<CheckoutSession>>('/payments/checkout', checkoutData);
    return data.data;
  },

  getPaymentByOrder: async (orderId: string): Promise<Payment> => {
    const { data } = await apiClient.get<ApiResponse<Payment>>(`/payments/order/${orderId}`);
    return data.data;
  },

  getPaymentHistory: async (): Promise<PaginatedResponse<Payment>> => {
    const { data } = await apiClient.get<PaginatedResponse<Payment>>('/payments/history');
    return data;
  },
};
