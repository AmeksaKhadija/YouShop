export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Payment {
  id: string;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  orderId: string;
  userId: string;
}

export interface CheckoutSession {
  sessionId: string;
  url: string;
}

export interface CreateCheckoutData {
  orderId: string;
}
