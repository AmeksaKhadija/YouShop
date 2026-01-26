export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000';
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

export const TAX_RATE = 0.20;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PAYMENT_PENDING: 'Paiement en cours',
  PAID: 'Payée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  PAYMENT_FAILED: 'Paiement échoué',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAYMENT_PENDING: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  PAYMENT_FAILED: 'bg-red-100 text-red-800',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PROCESSING: 'En cours',
  SUCCEEDED: 'Réussi',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
  REFUNDED: 'Remboursé',
};
