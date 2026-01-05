import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { PrismaService } from '../prisma/prisma.service';

describe('CatalogService', () => {
  let service: CatalogService;

  const mockCategory = {
    id: 'cat-uuid',
    name: 'Electronics',
    description: 'Electronic devices',
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { products: 5 },
  };

  const mockProduct = {
    id: 'prod-uuid',
    name: 'iPhone 15',
    description: 'Latest iPhone',
    price: 999.99,
    imageUrl: 'https://example.com/image.jpg',
    isActive: true,
    categoryId: 'cat-uuid',
    createdAt: new Date(),
    updatedAt: new Date(),
    category: { id: 'cat-uuid', name: 'Electronics' },
    inventory: { sku: 'IPHONE-15', quantity: 100, reserved: 5 },
  };

  const mockPrismaService = {
    category: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inventory: {
      findUnique: jest.fn(),
    },
    orderItem: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CatalogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CatalogService>(CatalogService);
    jest.clearAllMocks();
  });

  describe('Categories', () => {
    describe('createCategory', () => {
      it('should create a category successfully', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(null);
        mockPrismaService.category.create.mockResolvedValue(mockCategory);

        const result = await service.createCategory({
          name: 'Electronics',
          description: 'Electronic devices',
        });

        expect(result).toEqual(mockCategory);
      });

      it('should throw ConflictException if category exists', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

        await expect(
          service.createCategory({ name: 'Electronics' }),
        ).rejects.toThrow(ConflictException);
      });
    });

    describe('findAllCategories', () => {
      it('should return all categories', async () => {
        mockPrismaService.category.findMany.mockResolvedValue([mockCategory]);

        const result = await service.findAllCategories();

        expect(result).toEqual([mockCategory]);
      });
    });

    describe('findCategoryById', () => {
      it('should return category by id', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);

        const result = await service.findCategoryById('cat-uuid');

        expect(result).toEqual(mockCategory);
      });

      it('should throw NotFoundException if category not found', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(null);

        await expect(service.findCategoryById('invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });

    describe('deleteCategory', () => {
      it('should delete category without products', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
        mockPrismaService.product.count.mockResolvedValue(0);
        mockPrismaService.category.delete.mockResolvedValue(mockCategory);

        const result = await service.deleteCategory('cat-uuid');

        expect(result).toEqual(mockCategory);
      });

      it('should throw ConflictException if category has products', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
        mockPrismaService.product.count.mockResolvedValue(5);

        await expect(service.deleteCategory('cat-uuid')).rejects.toThrow(
          ConflictException,
        );
      });
    });
  });

  describe('Products', () => {
    describe('createProduct', () => {
      it('should create a product successfully', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(mockCategory);
        mockPrismaService.inventory.findUnique.mockResolvedValue(null);
        mockPrismaService.product.create.mockResolvedValue(mockProduct);

        const result = await service.createProduct({
          name: 'iPhone 15',
          price: 999.99,
          categoryId: 'cat-uuid',
        });

        expect(result).toEqual(mockProduct);
      });

      it('should throw NotFoundException if category not found', async () => {
        mockPrismaService.category.findUnique.mockResolvedValue(null);

        await expect(
          service.createProduct({
            name: 'iPhone 15',
            price: 999.99,
            categoryId: 'invalid-cat',
          }),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('findAllProducts', () => {
      it('should return paginated products', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
        mockPrismaService.product.count.mockResolvedValue(1);

        const result = await service.findAllProducts({ page: 1, limit: 10 });

        expect(result.data).toHaveLength(1);
        expect(result.meta.total).toBe(1);
      });

      it('should filter by category', async () => {
        mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
        mockPrismaService.product.count.mockResolvedValue(1);

        await service.findAllProducts({ categoryId: 'cat-uuid' });

        expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              categoryId: 'cat-uuid',
            }),
          }),
        );
      });
    });

    describe('findProductById', () => {
      it('should return product with available stock', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

        const result = await service.findProductById('prod-uuid');

        expect(result).toHaveProperty('availableStock', 95);
      });

      it('should throw NotFoundException if product not found', async () => {
        mockPrismaService.product.findUnique.mockResolvedValue(null);

        await expect(service.findProductById('invalid-id')).rejects.toThrow(
          NotFoundException,
        );
      });
    });
  });
});
