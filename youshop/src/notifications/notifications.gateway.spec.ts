import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsGateway } from './notifications.gateway';
import { Server, Socket } from 'socket.io';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') return 'test-secret';
      return null;
    }),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  } as unknown as Server;

  const createMockSocket = (overrides = {}): Socket => ({
    id: 'socket-123',
    handshake: {
      headers: { authorization: 'Bearer valid-token' },
      auth: {},
      query: {},
    },
    join: jest.fn(),
    leave: jest.fn(),
    emit: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  } as unknown as Socket);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);

    // Set mock server
    (gateway as any).server = mockServer;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization', () => {
      expect(() => gateway.afterInit()).not.toThrow();
    });
  });

  describe('handleConnection', () => {
    it('should authenticate user and join rooms', async () => {
      const mockPayload = { sub: 'user-123', role: 'CLIENT' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const socket = createMockSocket();
      await gateway.handleConnection(socket as any);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'test-secret',
      });
      expect(socket.join).toHaveBeenCalledWith('user:user-123');
      expect(socket.emit).toHaveBeenCalledWith('connected', expect.any(Object));
    });

    it('should join admin room for admin users', async () => {
      const mockPayload = { sub: 'admin-123', role: 'ADMIN' };
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const socket = createMockSocket();
      await gateway.handleConnection(socket as any);

      expect(socket.join).toHaveBeenCalledWith('admins');
    });

    it('should disconnect if no token provided', async () => {
      const socket = createMockSocket({
        handshake: {
          headers: {},
          auth: {},
          query: {},
        },
      });

      await gateway.handleConnection(socket as any);

      expect(socket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect if token is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      const socket = createMockSocket();
      await gateway.handleConnection(socket as any);

      expect(socket.disconnect).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect gracefully', () => {
      const socket = createMockSocket() as any;
      socket.userId = 'user-123';

      expect(() => gateway.handleDisconnect(socket)).not.toThrow();
    });
  });

  describe('handleSubscribe', () => {
    it('should join channel when subscribed', () => {
      const socket = createMockSocket() as any;
      socket.userId = 'user-123';

      gateway.handleSubscribe(socket, { channel: 'order:order-123' });

      expect(socket.join).toHaveBeenCalledWith('order:order-123');
    });

    it('should not join if no userId', () => {
      const socket = createMockSocket() as any;

      gateway.handleSubscribe(socket, { channel: 'order:order-123' });

      expect(socket.join).not.toHaveBeenCalled();
    });
  });

  describe('handleUnsubscribe', () => {
    it('should leave channel when unsubscribed', () => {
      const socket = createMockSocket() as any;

      gateway.handleUnsubscribe(socket, { channel: 'order:order-123' });

      expect(socket.leave).toHaveBeenCalledWith('order:order-123');
    });
  });

  describe('sendToUser', () => {
    it('should send event to specific user room', () => {
      gateway.sendToUser('user-123', 'test:event', { data: 'test' });

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith('test:event', { data: 'test' });
    });
  });

  describe('sendToAdmins', () => {
    it('should send event to admins room', () => {
      gateway.sendToAdmins('admin:event', { data: 'admin' });

      expect(mockServer.to).toHaveBeenCalledWith('admins');
      expect(mockServer.emit).toHaveBeenCalledWith('admin:event', { data: 'admin' });
    });
  });

  describe('broadcast', () => {
    it('should broadcast event to all connected clients', () => {
      gateway.broadcast('global:event', { data: 'global' });

      expect(mockServer.emit).toHaveBeenCalledWith('global:event', { data: 'global' });
    });
  });

  describe('notifyPaymentSuccess', () => {
    it('should send payment success notification to user', () => {
      gateway.notifyPaymentSuccess('user-123', {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        amount: 100,
      });

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'payment:success',
        expect.objectContaining({
          type: 'PAYMENT_SUCCESS',
          title: 'Paiement reussi',
        }),
      );
    });
  });

  describe('notifyPaymentFailed', () => {
    it('should send payment failed notification to user', () => {
      gateway.notifyPaymentFailed('user-123', {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        error: 'Card declined',
      });

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'payment:failed',
        expect.objectContaining({
          type: 'PAYMENT_FAILED',
          title: 'Echec du paiement',
        }),
      );
    });
  });

  describe('notifyOrderStatusUpdate', () => {
    it('should send order status notification to user', () => {
      gateway.notifyOrderStatusUpdate('user-123', {
        orderId: 'order-123',
        orderNumber: 'ORD-001',
        status: 'SHIPPED',
      });

      expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'order:status',
        expect.objectContaining({
          type: 'ORDER_STATUS',
        }),
      );
    });
  });

  describe('notifyLowStock', () => {
    it('should send low stock alert to admins', () => {
      gateway.notifyLowStock({
        productId: 'prod-123',
        productName: 'Test Product',
        sku: 'SKU-001',
        quantity: 5,
      });

      expect(mockServer.to).toHaveBeenCalledWith('admins');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'stock:low',
        expect.objectContaining({
          type: 'STOCK_LOW',
        }),
      );
    });
  });

  describe('notifyOutOfStock', () => {
    it('should send out of stock alert to admins', () => {
      gateway.notifyOutOfStock({
        productId: 'prod-123',
        productName: 'Test Product',
        sku: 'SKU-001',
      });

      expect(mockServer.to).toHaveBeenCalledWith('admins');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'stock:out',
        expect.objectContaining({
          type: 'STOCK_OUT',
        }),
      );
    });
  });

  describe('isUserOnline', () => {
    it('should return false when user is not connected', () => {
      expect(gateway.isUserOnline('user-123')).toBe(false);
    });
  });

  describe('getOnlineUsersCount', () => {
    it('should return 0 when no users are connected', () => {
      expect(gateway.getOnlineUsersCount()).toBe(0);
    });
  });
});
