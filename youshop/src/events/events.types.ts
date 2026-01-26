export interface PaymentEvent {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  errorMessage?: string;
}

export interface OrderEvent {
  orderId: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  items?: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface StockEvent {
  productId: string;
  productName: string;
  sku: string;
  currentQuantity: number;
  threshold: number;
}

export interface UserEvent {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}
