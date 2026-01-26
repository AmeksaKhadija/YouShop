import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

describe('PaymentController', () => {
  let controller: PaymentController;
  let service: PaymentService;

  const mockPaymentService = {
    createCheckoutSession: jest.fn(),
    handleWebhook: jest.fn(),
    getPaymentByOrderId: jest.fn(),
    getPaymentHistory: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        { provide: PaymentService, useValue: mockPaymentService },
      ],
    }).compile();

    controller = module.get<PaymentController>(PaymentController);
    service = module.get<PaymentService>(PaymentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCheckout', () => {
    it('should create a checkout session', async () => {
      const mockResponse = { sessionId: 'cs_123', url: 'https://checkout.stripe.com/...' };
      mockPaymentService.createCheckoutSession.mockResolvedValue(mockResponse);

      const result = await controller.createCheckout('user-123', { orderId: 'order-123' });

      expect(result).toEqual(mockResponse);
      expect(mockPaymentService.createCheckoutSession).toHaveBeenCalledWith('order-123', 'user-123');
    });
  });

  describe('handleWebhook', () => {
    it('should handle webhook and return received true', async () => {
      mockPaymentService.handleWebhook.mockResolvedValue(undefined);

      const mockReq = {
        rawBody: Buffer.from('{}'),
      } as any;

      const result = await controller.handleWebhook(mockReq, 'sig_123');

      expect(result).toEqual({ received: true });
      expect(mockPaymentService.handleWebhook).toHaveBeenCalledWith(
        mockReq.rawBody,
        'sig_123',
      );
    });

    it('should throw error if raw body not available', async () => {
      const mockReq = { rawBody: undefined } as any;

      await expect(controller.handleWebhook(mockReq, 'sig_123')).rejects.toThrow(
        'Raw body not available',
      );
    });
  });

  describe('getPaymentByOrder', () => {
    it('should get payment by order id', async () => {
      const mockPayment = { id: 'payment-123', amount: 100 };
      mockPaymentService.getPaymentByOrderId.mockResolvedValue(mockPayment);

      const result = await controller.getPaymentByOrder('user-123', 'order-123');

      expect(result).toEqual(mockPayment);
      expect(mockPaymentService.getPaymentByOrderId).toHaveBeenCalledWith('order-123', 'user-123');
    });
  });

  describe('getPaymentHistory', () => {
    it('should get payment history for user', async () => {
      const mockHistory = [{ id: 'payment-123' }, { id: 'payment-456' }];
      mockPaymentService.getPaymentHistory.mockResolvedValue(mockHistory);

      const result = await controller.getPaymentHistory('user-123');

      expect(result).toEqual(mockHistory);
      expect(mockPaymentService.getPaymentHistory).toHaveBeenCalledWith('user-123');
    });
  });
});
