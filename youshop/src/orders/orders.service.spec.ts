import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';

// Mock OrderStatus enum for tests
const OrderStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

describe('OrdersService', () => {
  let service: OrdersService;

  const mockProduct = {
    id: 'prod-uuid',
    name: 'iPhone 15',
    price: 999.99,
    isActive: true,
    inventory: { quantity: 100, reserved: 10 },
  };

  const mockOrder = {
    id: 'order-uuid',
    orderNumber: 'ORD-ABC123',
    userId: 'user-uuid',
    status: OrderStatus.PENDING,
    subtotal: 999.99,
    taxAmount: 200.00,
    totalAmount: 1199.99,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 1800000),
    items: [
      {
        id: 'item-uuid',
        productId: 'prod-uuid',
        quantity: 1,
        unitPrice: 999.99,
        totalPrice: 999.99,
        product: { id: 'prod-uuid', name: 'iPhone 15', imageUrl: null },
      },
    ],
  };

  const mockPrismaService = {
    product: {
      findMany: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockInventoryService = {
    checkAvailability: jest.fn(),
    reserveStock: jest.fn(),
    releaseStock: jest.fn(),
    confirmStockDeduction: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: number) => {
      if (key === 'TAX_RATE') return 0.2;
      if (key === 'ORDER_EXPIRATION_MS') return 1800000;
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: InventoryService, useValue: mockInventoryService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    jest.clearAllMocks();
  });

  describe('createOrder', () => {
    const createOrderDto = {
      items: [{ productId: 'prod-uuid', quantity: 1 }],
    };

    it('should create order successfully', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockInventoryService.checkAvailability.mockResolvedValue({
        available: true,
        unavailableItems: [],
      });
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return mockOrder;
      });

      const result = await service.createOrder('user-uuid', createOrderDto);

      expect(result).toHaveProperty('orderNumber');
      expect(mockInventoryService.checkAvailability).toHaveBeenCalled();
    });

    it('should throw BadRequestException if product not found', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);

      await expect(
        service.createOrder('user-uuid', createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if stock unavailable', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockInventoryService.checkAvailability.mockResolvedValue({
        available: false,
        unavailableItems: ['iPhone 15'],
      });

      await expect(
        service.createOrder('user-uuid', createOrderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findUserOrders', () => {
    it('should return paginated user orders', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([mockOrder]);
      mockPrismaService.order.count.mockResolvedValue(1);

      const result = await service.findUserOrders('user-uuid', { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toBe(1);
    });

    it('should filter by status', async () => {
      mockPrismaService.order.findMany.mockResolvedValue([]);
      mockPrismaService.order.count.mockResolvedValue(0);

      await service.findUserOrders('user-uuid', {
        page: 1,
        limit: 10,
        status: OrderStatus.PENDING,
      });

      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: OrderStatus.PENDING,
          }),
        }),
      );
    });
  });

  describe('findOrderById', () => {
    it('should return order details', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOrderById('order-uuid');

      expect(result).toHaveProperty('orderNumber');
    });

    it('should throw NotFoundException if order not found', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(service.findOrderById('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user tries to access another user order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.findOrderById('order-uuid', 'other-user-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order to PAID and confirm stock deduction', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.PAID,
      });

      const result = await service.updateOrderStatus('order-uuid', {
        status: OrderStatus.PAID,
      });

      expect(result.status).toBe(OrderStatus.PAID);
      expect(mockInventoryService.confirmStockDeduction).toHaveBeenCalled();
    });

    it('should update order to CANCELLED and release stock', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.updateOrderStatus('order-uuid', {
        status: OrderStatus.CANCELLED,
      });

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockInventoryService.releaseStock).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid status transition', async () => {
      const deliveredOrder = { ...mockOrder, status: OrderStatus.DELIVERED };
      mockPrismaService.order.findUnique.mockResolvedValue(deliveredOrder);

      await expect(
        service.updateOrderStatus('order-uuid', { status: OrderStatus.PENDING }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel own pending order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      const result = await service.cancelOrder('order-uuid', 'user-uuid');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockInventoryService.releaseStock).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when cancelling other user order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.cancelOrder('order-uuid', 'other-user-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when cancelling non-pending order', async () => {
      const paidOrder = { ...mockOrder, status: OrderStatus.PAID };
      mockPrismaService.order.findUnique.mockResolvedValue(paidOrder);

      await expect(
        service.cancelOrder('order-uuid', 'user-uuid'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
