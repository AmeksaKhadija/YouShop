import { Product } from './product';
import { User } from './user';

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

export interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  orderId: string;
  productId: string;
  product?: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  expiresAt?: string;
  userId: string;
  user?: User;
  items: OrderItem[];
}

export interface CreateOrderData {
  items: {
    productId: string;
    quantity: number;
  }[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
}
