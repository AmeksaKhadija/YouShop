import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStatus } from '@prisma/client';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;

  const mockOrdersService = {
    createOrder: jest.fn(),
    getAllOrders: jest.fn(),
    findUserOrders: jest.fn(),
    findOrderById: jest.fn(),
    updateOrderStatus: jest.fn(),
    cancelOrder: jest.fn(),
    processExpiredOrders: jest.fn(),
  };

  const mockOrder = {
    id: 'order-123',
    orderNumber: 'ORD-2024-001',
    status: OrderStatus.PENDING,
    subtotal: 100,
    taxAmount: 20,
    totalAmount: 120,
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    items: [],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: mockOrdersService },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create an order', async () => {
      const dto = {
        items: [{ productId: 'prod-123', quantity: 2 }],
      };
      mockOrdersService.createOrder.mockResolvedValue(mockOrder);

      const result = await controller.createOrder('user-123', dto);

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.createOrder).toHaveBeenCalledWith('user-123', dto);
    });
  });

  describe('findAllOrders', () => {
    it('should return all orders (admin)', async () => {
      const orders = [mockOrder];
      const paginatedResult = {
        data: orders,
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockOrdersService.getAllOrders.mockResolvedValue(paginatedResult);

      const result = await controller.findAllOrders({});

      expect(result).toEqual(paginatedResult);
      expect(mockOrdersService.getAllOrders).toHaveBeenCalledWith({});
    });
  });

  describe('findMyOrders', () => {
    it('should return user orders', async () => {
      const orders = [mockOrder];
      mockOrdersService.findUserOrders.mockResolvedValue(orders);

      const result = await controller.findMyOrders('user-123', {});

      expect(result).toEqual(orders);
      expect(mockOrdersService.findUserOrders).toHaveBeenCalledWith('user-123', {});
    });
  });

  describe('findOrderById', () => {
    it('should return an order by id (admin)', async () => {
      mockOrdersService.findOrderById.mockResolvedValue(mockOrder);

      const result = await controller.findOrderById('order-123');

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.findOrderById).toHaveBeenCalledWith('order-123');
    });
  });

  describe('findMyOrderById', () => {
    it('should return user order by id', async () => {
      mockOrdersService.findOrderById.mockResolvedValue(mockOrder);

      const result = await controller.findMyOrderById('user-123', 'order-123');

      expect(result).toEqual(mockOrder);
      expect(mockOrdersService.findOrderById).toHaveBeenCalledWith('order-123', 'user-123');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status (admin)', async () => {
      const dto = { status: OrderStatus.SHIPPED };
      const updated = { ...mockOrder, status: OrderStatus.SHIPPED };
      mockOrdersService.updateOrderStatus.mockResolvedValue(updated);

      const result = await controller.updateOrderStatus('order-123', dto);

      expect(result).toEqual(updated);
      expect(mockOrdersService.updateOrderStatus).toHaveBeenCalledWith('order-123', dto);
    });
  });

  describe('cancelMyOrder', () => {
    it('should cancel user order', async () => {
      const cancelled = { ...mockOrder, status: OrderStatus.CANCELLED };
      mockOrdersService.cancelOrder.mockResolvedValue(cancelled);

      const result = await controller.cancelMyOrder('user-123', 'order-123');

      expect(result).toEqual(cancelled);
      expect(mockOrdersService.cancelOrder).toHaveBeenCalledWith('order-123', 'user-123');
    });
  });

  describe('processExpiredOrders', () => {
    it('should process expired orders', async () => {
      const processedResult = { processed: 5 };
      mockOrdersService.processExpiredOrders.mockResolvedValue(processedResult);

      const result = await controller.processExpiredOrders();

      expect(result).toEqual(processedResult);
      expect(mockOrdersService.processExpiredOrders).toHaveBeenCalled();
    });
  });
});
