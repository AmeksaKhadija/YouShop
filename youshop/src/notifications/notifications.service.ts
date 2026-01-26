import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';
import { MailerService } from './mailer.service';
import { Events } from '../events';

// Define interfaces locally to avoid decorator metadata issues
interface PaymentEventData {
  paymentId: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  stripeSessionId?: string;
  stripePaymentIntent?: string;
  errorMessage?: string;
}

interface OrderEventData {
  orderId: string;
  orderNumber: string;
  userId: string;
  userEmail: string;
  totalAmount: number;
  status: string;
}

interface StockEventData {
  productId: string;
  productName: string;
  sku: string;
  currentQuantity: number;
  threshold: number;
}

interface UserEventData {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
    private readonly mailer: MailerService,
  ) {}

  // =====================
  // PAYMENT EVENTS
  // =====================

  @OnEvent(Events.PAYMENT_SUCCEEDED)
  async handlePaymentSucceeded(event: PaymentEventData): Promise<void> {
    this.logger.log(`Payment succeeded: ${event.paymentId}`);

    // Get order details
    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      this.logger.warn(`Order not found: ${event.orderId}`);
      return;
    }

    // Send WebSocket notification
    this.gateway.notifyPaymentSuccess(event.userId, {
      orderId: event.orderId,
      orderNumber: order.orderNumber,
      amount: event.amount,
    });

    // Send email
    await this.mailer.sendPaymentConfirmation(order.user.email, {
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      orderNumber: order.orderNumber,
      amount: event.amount,
      currency: event.currency.toUpperCase(),
      paymentDate: new Date().toISOString(),
      transactionId: event.stripePaymentIntent || event.paymentId,
    });

    // Send order confirmation email
    await this.mailer.sendOrderConfirmation(order.user.email, {
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      paymentMethod: 'Carte bancaire',
    });
  }

  @OnEvent(Events.PAYMENT_FAILED)
  async handlePaymentFailed(event: PaymentEventData): Promise<void> {
    this.logger.log(`Payment failed: ${event.paymentId}`);

    const order = await this.prisma.order.findUnique({
      where: { id: event.orderId },
      include: { user: true },
    });

    if (!order) {
      return;
    }

    // Send WebSocket notification
    this.gateway.notifyPaymentFailed(event.userId, {
      orderId: event.orderId,
      orderNumber: order.orderNumber,
      error: event.errorMessage || 'Unknown error',
    });

    // Send email
    await this.mailer.sendPaymentFailed(order.user.email, {
      customerName: `${order.user.firstName} ${order.user.lastName}`,
      orderNumber: order.orderNumber,
      amount: event.amount,
      currency: event.currency.toUpperCase(),
      errorMessage: event.errorMessage || 'Une erreur est survenue lors du paiement.',
    });
  }

  // =====================
  // ORDER EVENTS
  // =====================

  @OnEvent(Events.ORDER_PAID)
  async handleOrderPaid(event: OrderEventData): Promise<void> {
    this.logger.log(`Order paid: ${event.orderNumber}`);

    this.gateway.notifyOrderStatusUpdate(event.userId, {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      status: 'PAID',
    });
  }

  @OnEvent(Events.ORDER_SHIPPED)
  async handleOrderShipped(event: OrderEventData): Promise<void> {
    this.logger.log(`Order shipped: ${event.orderNumber}`);

    this.gateway.notifyOrderStatusUpdate(event.userId, {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      status: 'SHIPPED',
    });
  }

  @OnEvent(Events.ORDER_DELIVERED)
  async handleOrderDelivered(event: OrderEventData): Promise<void> {
    this.logger.log(`Order delivered: ${event.orderNumber}`);

    this.gateway.notifyOrderStatusUpdate(event.userId, {
      orderId: event.orderId,
      orderNumber: event.orderNumber,
      status: 'DELIVERED',
    });
  }

  // =====================
  // STOCK EVENTS
  // =====================

  @OnEvent(Events.STOCK_LOW)
  async handleLowStock(event: StockEventData): Promise<void> {
    this.logger.warn(`Low stock alert: ${event.productName} (${event.sku}) - ${event.currentQuantity} units`);

    this.gateway.notifyLowStock({
      productId: event.productId,
      productName: event.productName,
      sku: event.sku,
      quantity: event.currentQuantity,
    });
  }

  @OnEvent(Events.STOCK_OUT)
  async handleOutOfStock(event: StockEventData): Promise<void> {
    this.logger.error(`Out of stock: ${event.productName} (${event.sku})`);

    this.gateway.notifyOutOfStock({
      productId: event.productId,
      productName: event.productName,
      sku: event.sku,
    });
  }

  // =====================
  // USER EVENTS
  // =====================

  @OnEvent(Events.USER_REGISTERED)
  async handleUserRegistered(event: UserEventData): Promise<void> {
    this.logger.log(`User registered: ${event.email}`);

    await this.mailer.sendWelcomeEmail(event.email, {
      firstName: event.firstName,
      lastName: event.lastName,
    });
  }
}
