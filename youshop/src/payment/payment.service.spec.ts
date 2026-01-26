import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;
  let eventEmitter: EventEmitter2;

  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    paymentLog: {
      create: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_mock_key',
        STRIPE_WEBHOOK_SECRET: 'whsec_mock_secret',
        STRIPE_CURRENCY: 'eur',
        FRONTEND_URL: 'http://localhost:3001',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-2024-001',
    userId: 'user-123',
    status: OrderStatus.PENDING,
    subtotal: 100,
    taxAmount: 20,
    totalAmount: 120,
    user: mockUser,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 2,
        unitPrice: 50,
        totalPrice: 100,
        product: {
          id: 'prod-1',
          name: 'Test Product',
          description: 'A test product',
          imageUrl: 'http://example.com/image.jpg',
        },
      },
    ],
  };

  const mockPayment = {
    id: 'payment-123',
    stripeSessionId: 'cs_test_123',
    stripePaymentIntent: null,
    amount: 120,
    currency: 'eur',
    status: PaymentStatus.PENDING,
    idempotencyKey: 'order_order-123_1234567890',
    orderId: 'order-123',
    userId: 'user-123',
    order: mockOrder,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCheckoutSession', () => {
    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createCheckoutSession('order-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order belongs to another user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        userId: 'another-user',
      });

      await expect(
        service.createCheckoutSession('order-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if order status is not PENDING', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      await expect(
        service.createCheckoutSession('order-123', 'user-123'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getPaymentByOrderId', () => {
    it('should return payment for valid order', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        logs: [],
      });

      const result = await service.getPaymentByOrderId('order-123', 'user-123');

      expect(result).toBeDefined();
      expect(mockPrismaService.payment.findFirst).toHaveBeenCalledWith({
        where: { orderId: 'order-123', userId: 'user-123' },
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should throw NotFoundException if payment not found', async () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.getPaymentByOrderId('order-123', 'user-123'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getPaymentHistory', () => {
    it('should return payment history for user', async () => {
      const mockPayments = [
        {
          ...mockPayment,
          order: { orderNumber: 'ORD-001', totalAmount: 120 },
        },
      ];
      mockPrismaService.payment.findMany.mockResolvedValue(mockPayments);

      const result = await service.getPaymentHistory('user-123');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.payment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
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
    });

    it('should return empty array if no payments', async () => {
      mockPrismaService.payment.findMany.mockResolvedValue([]);

      const result = await service.getPaymentHistory('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('handleWebhook', () => {
    it('should throw BadRequestException for invalid signature', async () => {
      // The Stripe mock will throw on invalid signature
      const mockStripe = (service as any).stripe;
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      await expect(
        service.handleWebhook(Buffer.from('{}'), 'invalid-signature'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
