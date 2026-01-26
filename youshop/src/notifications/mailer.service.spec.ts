import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer.service';

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

describe('MailerService', () => {
  let service: MailerService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string | number) => {
      const config: Record<string, string | number> = {
        MAIL_HOST: 'smtp.test.com',
        MAIL_PORT: 587,
        MAIL_USER: 'test@test.com',
        MAIL_PASSWORD: 'test-password',
        MAIL_FROM: 'YouShop <noreply@youshop.com>',
        FRONTEND_URL: 'http://localhost:3001',
      };
      return config[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailerService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MailerService>(MailerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendOrderConfirmation', () => {
    it('should send order confirmation email', async () => {
      const result = await service.sendOrderConfirmation('customer@test.com', {
        customerName: 'John Doe',
        orderNumber: 'ORD-2024-001',
        orderDate: new Date().toISOString(),
        items: [
          { name: 'Product 1', quantity: 2, unitPrice: 50, totalPrice: 100 },
        ],
        subtotal: 100,
        taxAmount: 20,
        totalAmount: 120,
        paymentMethod: 'card',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendPaymentConfirmation', () => {
    it('should send payment confirmation email', async () => {
      const result = await service.sendPaymentConfirmation('customer@test.com', {
        customerName: 'John Doe',
        orderNumber: 'ORD-2024-001',
        amount: 120,
        currency: 'EUR',
        paymentDate: new Date().toISOString(),
        transactionId: 'txn_123456',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendPaymentFailed', () => {
    it('should send payment failed email', async () => {
      const result = await service.sendPaymentFailed('customer@test.com', {
        customerName: 'John Doe',
        orderNumber: 'ORD-2024-001',
        amount: 120,
        currency: 'EUR',
        errorMessage: 'Card declined',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email', async () => {
      const result = await service.sendWelcomeEmail('newuser@test.com', {
        firstName: 'Jane',
        lastName: 'Doe',
      });

      expect(result).toBe(true);
    });
  });

  describe('sendMail', () => {
    it('should return false for unknown template', async () => {
      const result = await service.sendMail({
        to: 'test@test.com',
        subject: 'Test',
        template: 'unknown-template',
        context: {},
      });

      expect(result).toBe(false);
    });
  });
});
