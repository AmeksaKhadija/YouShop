import { Test, TestingModule } from '@nestjs/testing';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';

describe('InventoryController', () => {
  let controller: InventoryController;
  let service: InventoryService;

  const mockInventoryService = {
    findBySku: jest.fn(),
    updateStock: jest.fn(),
    adjustStock: jest.fn(),
    getLowStockProducts: jest.fn(),
    getOutOfStockProducts: jest.fn(),
  };

  const mockInventory = {
    id: 'inv-123',
    sku: 'SKU-001',
    quantity: 100,
    reserved: 5,
    lowStockAlert: 10,
    productId: 'prod-123',
    product: {
      id: 'prod-123',
      name: 'Test Product',
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventoryController],
      providers: [
        { provide: InventoryService, useValue: mockInventoryService },
      ],
    }).compile();

    controller = module.get<InventoryController>(InventoryController);
    service = module.get<InventoryService>(InventoryService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findBySku', () => {
    it('should return inventory by SKU', async () => {
      mockInventoryService.findBySku.mockResolvedValue(mockInventory);

      const result = await controller.findBySku('SKU-001');

      expect(result).toEqual(mockInventory);
      expect(mockInventoryService.findBySku).toHaveBeenCalledWith('SKU-001');
    });
  });

  describe('updateStock', () => {
    it('should update stock quantity', async () => {
      const dto = { quantity: 150, lowStockAlert: 15 };
      const updated = { ...mockInventory, ...dto };
      mockInventoryService.updateStock.mockResolvedValue(updated);

      const result = await controller.updateStock('SKU-001', dto);

      expect(result).toEqual(updated);
      expect(mockInventoryService.updateStock).toHaveBeenCalledWith('SKU-001', dto);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock by delta', async () => {
      const dto = { adjustment: -10, reason: 'Sold' };
      const adjusted = { ...mockInventory, quantity: 90 };
      mockInventoryService.adjustStock.mockResolvedValue(adjusted);

      const result = await controller.adjustStock('SKU-001', dto);

      expect(result).toEqual(adjusted);
      expect(mockInventoryService.adjustStock).toHaveBeenCalledWith('SKU-001', dto);
    });
  });

  describe('getLowStockProducts', () => {
    it('should return low stock products', async () => {
      const lowStockItems = [mockInventory];
      mockInventoryService.getLowStockProducts.mockResolvedValue(lowStockItems);

      const result = await controller.getLowStockProducts();

      expect(result).toEqual(lowStockItems);
      expect(mockInventoryService.getLowStockProducts).toHaveBeenCalled();
    });
  });

  describe('getOutOfStockProducts', () => {
    it('should return out of stock products', async () => {
      const outOfStockItems = [{ ...mockInventory, quantity: 0 }];
      mockInventoryService.getOutOfStockProducts.mockResolvedValue(outOfStockItems);

      const result = await controller.getOutOfStockProducts();

      expect(result).toEqual(outOfStockItems);
      expect(mockInventoryService.getOutOfStockProducts).toHaveBeenCalled();
    });
  });
});
