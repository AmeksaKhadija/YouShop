import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { Events, PaymentEvent } from '../events';
import { OrderStatus, PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);
  private readonly currency: string;
  private readonly frontendUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }

    this.stripe = new Stripe(stripeSecretKey);

    this.currency = this.configService.get<string>('STRIPE_CURRENCY', 'eur');
    this.frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3001');
  }

  async createCheckoutSession(orderId: string, userId: string): Promise<{ sessionId: string; url: string }> {
    // Fetch order with items
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new BadRequestException('You can only pay for your own orders');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Order cannot be paid. Current status: ${order.status}`);
    }

    // Check for existing pending payment (idempotency)
    const existingPayment = await this.prisma.payment.findFirst({
      where: {
        orderId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
      },
    });

    if (existingPayment?.stripeSessionId) {
      // Return existing session
      try {
        const session = await this.stripe.checkout.sessions.retrieve(existingPayment.stripeSessionId);
        if (session.status === 'open' && session.url) {
          return { sessionId: session.id, url: session.url };
        }
      } catch {
        // Session expired or invalid, create new one
      }
    }

    // Generate idempotency key
    const idempotencyKey = `order_${orderId}_${Date.now()}`;

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
      price_data: {
        currency: this.currency,
        product_data: {
          name: item.product.name,
          description: item.product.description || undefined,
          images: item.product.imageUrl ? [item.product.imageUrl] : undefined,
        },
        unit_amount: Math.round(Number(item.unitPrice) * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add tax as a separate line item
    const taxAmount = Number(order.taxAmount);
    if (taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: this.currency,
          product_data: {
            name: 'TVA (20%)',
          },
          unit_amount: Math.round(taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe Checkout Session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${this.frontendUrl}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${this.frontendUrl}/orders/${orderId}/cancel`,
      customer_email: order.user.email,
      metadata: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        userId: order.userId,
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
    });

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        stripeSessionId: session.id,
        amount: Number(order.totalAmount),
        currency: this.currency,
        status: PaymentStatus.PENDING,
        idempotencyKey,
        orderId: order.id,
        userId: order.userId,
        metadata: {
          orderNumber: order.orderNumber,
          customerEmail: order.user.email,
        },
      },
    });

    // Log payment initiation
    await this.logPaymentEvent(payment.id, 'CHECKOUT_CREATED', PaymentStatus.PENDING, {
      sessionId: session.id,
      amount: Number(order.totalAmount),
    });

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAYMENT_PENDING },
    });

    // Emit event
    const paymentEvent: PaymentEvent = {
      paymentId: payment.id,
      orderId: order.id,
      userId: order.userId,
      amount: Number(order.totalAmount),
      currency: this.currency,
      stripeSessionId: session.id,
    };
    this.eventEmitter.emit(Events.PAYMENT_INITIATED, paymentEvent);

    this.logger.log(`Checkout session created for order ${order.orderNumber}: ${session.id}`);

    return {
      sessionId: session.id,
      url: session.url!,
    };
  }

  async handleWebhook(payload: Buffer, signature: string): Promise<void> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not defined');
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err}`);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received Stripe webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'checkout.session.expired':
        await this.handleCheckoutExpired(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for session: ${session.id}`);
      return;
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        stripePaymentIntent: session.payment_intent as string,
        status: PaymentStatus.SUCCEEDED,
        completedAt: new Date(),
      },
    });

    // Update order
    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    });

    // Log event
    await this.logPaymentEvent(payment.id, 'CHECKOUT_COMPLETED', PaymentStatus.SUCCEEDED, {
      paymentIntent: session.payment_intent,
    });

    // Emit success event
    const paymentEvent: PaymentEvent = {
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: Number(payment.amount),
      currency: payment.currency,
      stripeSessionId: session.id,
      stripePaymentIntent: session.payment_intent as string,
    };
    this.eventEmitter.emit(Events.PAYMENT_SUCCEEDED, paymentEvent);

    this.logger.log(`Payment succeeded for order ${payment.order.orderNumber}`);
  }

  private async handleCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!payment) {
      return;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.CANCELLED,
        errorMessage: 'Checkout session expired',
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.PENDING },
    });

    await this.logPaymentEvent(payment.id, 'CHECKOUT_EXPIRED', PaymentStatus.CANCELLED, {});

    this.logger.log(`Checkout expired for payment ${payment.id}`);
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { stripePaymentIntent: paymentIntent.id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for payment intent: ${paymentIntent.id}`);
      return;
    }

    await this.logPaymentEvent(payment.id, 'PAYMENT_INTENT_SUCCEEDED', PaymentStatus.SUCCEEDED, {
      paymentIntentId: paymentIntent.id,
    });
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const payment = await this.prisma.payment.findFirst({
      where: { stripePaymentIntent: paymentIntent.id },
    });

    if (!payment) {
      return;
    }

    const errorMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.FAILED,
        errorMessage,
      },
    });

    await this.prisma.order.update({
      where: { id: payment.orderId },
      data: { status: OrderStatus.PAYMENT_FAILED },
    });

    await this.logPaymentEvent(payment.id, 'PAYMENT_FAILED', PaymentStatus.FAILED, {
      error: errorMessage,
    });

    // Emit failure event
    const paymentEvent: PaymentEvent = {
      paymentId: payment.id,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: Number(payment.amount),
      currency: payment.currency,
      stripePaymentIntent: paymentIntent.id,
      errorMessage,
    };
    this.eventEmitter.emit(Events.PAYMENT_FAILED, paymentEvent);

    this.logger.error(`Payment failed for payment ${payment.id}: ${errorMessage}`);
  }

  async getPaymentByOrderId(orderId: string, userId: string): Promise<unknown> {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, userId },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }

  async getPaymentHistory(userId: string): Promise<unknown[]> {
    const payments = await this.prisma.payment.findMany({
      where: { userId },
      include: {
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
      order: {
        ...p.order,
        totalAmount: Number(p.order.totalAmount),
      },
    }));
  }

  private async logPaymentEvent(
    paymentId: string,
    event: string,
    status: PaymentStatus,
    details: object,
  ): Promise<void> {
    await this.prisma.paymentLog.create({
      data: {
        paymentId,
        event,
        status,
        details: details as any,
      },
    });
  }
}
