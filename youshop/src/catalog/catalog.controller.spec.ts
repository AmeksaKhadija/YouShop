import { Test, TestingModule } from '@nestjs/testing';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

describe('CatalogController', () => {
  let controller: CatalogController;
  let service: CatalogService;

  const mockCatalogService = {
    createCategory: jest.fn(),
    findAllCategories: jest.fn(),
    findCategoryById: jest.fn(),
    updateCategory: jest.fn(),
    deleteCategory: jest.fn(),
    createProduct: jest.fn(),
    findAllProducts: jest.fn(),
    findProductById: jest.fn(),
    updateProduct: jest.fn(),
    deleteProduct: jest.fn(),
  };

  const mockCategory = {
    id: 'cat-123',
    name: 'Electronics',
    description: 'Electronic products',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'prod-123',
    name: 'iPhone',
    description: 'Apple iPhone',
    price: 999,
    imageUrl: 'http://example.com/iphone.jpg',
    isActive: true,
    categoryId: 'cat-123',
    category: mockCategory,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CatalogController],
      providers: [
        { provide: CatalogService, useValue: mockCatalogService },
      ],
    }).compile();

    controller = module.get<CatalogController>(CatalogController);
    service = module.get<CatalogService>(CatalogService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Category Tests
  describe('createCategory', () => {
    it('should create a category', async () => {
      const dto = { name: 'Electronics', description: 'Electronic products' };
      mockCatalogService.createCategory.mockResolvedValue(mockCategory);

      const result = await controller.createCategory(dto);

      expect(result).toEqual(mockCategory);
      expect(mockCatalogService.createCategory).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [mockCategory];
      mockCatalogService.findAllCategories.mockResolvedValue(categories);

      const result = await controller.findAllCategories();

      expect(result).toEqual(categories);
      expect(mockCatalogService.findAllCategories).toHaveBeenCalled();
    });
  });

  describe('findCategoryById', () => {
    it('should return a category by id', async () => {
      mockCatalogService.findCategoryById.mockResolvedValue(mockCategory);

      const result = await controller.findCategoryById('cat-123');

      expect(result).toEqual(mockCategory);
      expect(mockCatalogService.findCategoryById).toHaveBeenCalledWith('cat-123');
    });
  });

  describe('updateCategory', () => {
    it('should update a category', async () => {
      const dto = { name: 'Updated Electronics' };
      const updated = { ...mockCategory, ...dto };
      mockCatalogService.updateCategory.mockResolvedValue(updated);

      const result = await controller.updateCategory('cat-123', dto);

      expect(result).toEqual(updated);
      expect(mockCatalogService.updateCategory).toHaveBeenCalledWith('cat-123', dto);
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category', async () => {
      mockCatalogService.deleteCategory.mockResolvedValue(undefined);

      await controller.deleteCategory('cat-123');

      expect(mockCatalogService.deleteCategory).toHaveBeenCalledWith('cat-123');
    });
  });

  // Product Tests
  describe('createProduct', () => {
    it('should create a product', async () => {
      const dto = {
        name: 'iPhone',
        description: 'Apple iPhone',
        price: 999,
        categoryId: 'cat-123',
        sku: 'SKU-001',
        initialStock: 100,
      };
      mockCatalogService.createProduct.mockResolvedValue(mockProduct);

      const result = await controller.createProduct(dto);

      expect(result).toEqual(mockProduct);
      expect(mockCatalogService.createProduct).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAllProducts', () => {
    it('should return all products with filters', async () => {
      const filter = { page: 1, limit: 10 };
      const paginatedResult = {
        data: [mockProduct],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      };
      mockCatalogService.findAllProducts.mockResolvedValue(paginatedResult);

      const result = await controller.findAllProducts(filter);

      expect(result).toEqual(paginatedResult);
      expect(mockCatalogService.findAllProducts).toHaveBeenCalledWith(filter);
    });
  });

  describe('findProductById', () => {
    it('should return a product by id', async () => {
      mockCatalogService.findProductById.mockResolvedValue(mockProduct);

      const result = await controller.findProductById('prod-123');

      expect(result).toEqual(mockProduct);
      expect(mockCatalogService.findProductById).toHaveBeenCalledWith('prod-123');
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const dto = { name: 'iPhone 15' };
      const updated = { ...mockProduct, ...dto };
      mockCatalogService.updateProduct.mockResolvedValue(updated);

      const result = await controller.updateProduct('prod-123', dto);

      expect(result).toEqual(updated);
      expect(mockCatalogService.updateProduct).toHaveBeenCalledWith('prod-123', dto);
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      mockCatalogService.deleteProduct.mockResolvedValue(undefined);

      await controller.deleteProduct('prod-123');

      expect(mockCatalogService.deleteProduct).toHaveBeenCalledWith('prod-123');
    });
  });
});
