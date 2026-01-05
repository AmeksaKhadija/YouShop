import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../prisma/prisma.service';

describe('InventoryService', () => {
  let service: InventoryService;

  const mockInventory = {
    id: 'inv-uuid',
    sku: 'IPHONE-15-PRO',
    quantity: 100,
    reserved: 10,
    lowStockAlert: 10,
    productId: 'prod-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    product: {
      id: 'prod-uuid',
      name: 'iPhone 15 Pro',
      price: 999.99,
      isActive: true,
    },
  };

  const mockPrismaService = {
    inventory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      fields: {
        lowStockAlert: 'lowStockAlert',
        reserved: 'reserved',
      },
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    jest.clearAllMocks();
  });

  describe('findBySku', () => {
    it('should return inventory with available stock', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);

      const result = await service.findBySku('IPHONE-15-PRO');

      expect(result).toHaveProperty('availableStock', 90);
      expect(result.sku).toBe('IPHONE-15-PRO');
    });

    it('should throw NotFoundException if SKU not found', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(null);

      await expect(service.findBySku('INVALID-SKU')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrismaService.inventory.update.mockResolvedValue({
        ...mockInventory,
        quantity: 150,
      });

      const result = await service.updateStock('IPHONE-15-PRO', { quantity: 150 });

      expect(result.quantity).toBe(150);
    });

    it('should throw BadRequestException if new quantity is below reserved', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);

      await expect(
        service.updateStock('IPHONE-15-PRO', { quantity: 5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('adjustStock', () => {
    it('should increase stock by adjustment amount', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrismaService.inventory.update.mockResolvedValue({
        ...mockInventory,
        quantity: 120,
      });

      const result = await service.adjustStock('IPHONE-15-PRO', { adjustment: 20 });

      expect(result.quantity).toBe(120);
    });

    it('should decrease stock by adjustment amount', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);
      mockPrismaService.inventory.update.mockResolvedValue({
        ...mockInventory,
        quantity: 80,
      });

      const result = await service.adjustStock('IPHONE-15-PRO', { adjustment: -20 });

      expect(result.quantity).toBe(80);
    });

    it('should throw BadRequestException if stock would go negative', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);

      await expect(
        service.adjustStock('IPHONE-15-PRO', { adjustment: -200 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkAvailability', () => {
    it('should return available true when stock is sufficient', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);

      const result = await service.checkAvailability([
        { productId: 'prod-uuid', quantity: 50 },
      ]);

      expect(result.available).toBe(true);
      expect(result.unavailableItems).toHaveLength(0);
    });

    it('should return unavailable items when stock is insufficient', async () => {
      mockPrismaService.inventory.findUnique.mockResolvedValue(mockInventory);

      const result = await service.checkAvailability([
        { productId: 'prod-uuid', quantity: 100 },
      ]);

      expect(result.available).toBe(false);
      expect(result.unavailableItems).toContain('iPhone 15 Pro');
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock successfully', async () => {
      const mockTx = {
        inventory: {
          findUnique: jest.fn().mockResolvedValue(mockInventory),
          update: jest.fn().mockResolvedValue({ ...mockInventory, reserved: 20 }),
        },
      };
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockTx),
      );

      await expect(
        service.reserveStock([{ productId: 'prod-uuid', quantity: 10 }]),
      ).resolves.not.toThrow();
    });
  });

  describe('releaseStock', () => {
    it('should release reserved stock', async () => {
      const mockTx = {
        inventory: {
          findUnique: jest.fn().mockResolvedValue(mockInventory),
          update: jest.fn().mockResolvedValue({ ...mockInventory, reserved: 0 }),
        },
      };
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockTx),
      );

      await expect(
        service.releaseStock([{ productId: 'prod-uuid', quantity: 10 }]),
      ).resolves.not.toThrow();
    });
  });
});
