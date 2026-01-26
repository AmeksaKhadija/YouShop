export const Events = {
  // Payment Events
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  PAYMENT_FAILED: 'payment.failed',
  PAYMENT_REFUNDED: 'payment.refunded',

  // Order Events
  ORDER_CREATED: 'order.created',
  ORDER_PAID: 'order.paid',
  ORDER_SHIPPED: 'order.shipped',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',

  // Inventory Events
  STOCK_LOW: 'stock.low',
  STOCK_OUT: 'stock.out',
  STOCK_UPDATED: 'stock.updated',

  // User Events
  USER_REGISTERED: 'user.registered',
} as const;

export type EventType = (typeof Events)[keyof typeof Events];
