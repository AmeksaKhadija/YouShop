import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  ProductFilterDto,
  ProductSortBy,
} from './dto';
import { PaginatedResponse } from '../common/interfaces';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  // =====================
  // CATEGORY OPERATIONS
  // =====================

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    return this.prisma.category.create({
      data: dto,
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    await this.findCategoryById(id);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCategory(id: string) {
    await this.findCategoryById(id);

    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    if (productsCount > 0) {
      throw new ConflictException(
        'Cannot delete category with existing products',
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }

  // =====================
  // PRODUCT OPERATIONS
  // =====================

  async createProduct(dto: CreateProductDto) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Generate SKU if not provided
    const sku = dto.sku || this.generateSku(dto.name);

    // Check if SKU already exists
    const existingSku = await this.prisma.inventory.findUnique({
      where: { sku },
    });

    if (existingSku) {
      throw new ConflictException('Product with this SKU already exists');
    }

    // Create product with inventory
    return this.prisma.product.create({
      data: {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        imageUrl: dto.imageUrl,
        categoryId: dto.categoryId,
        inventory: {
          create: {
            sku,
            quantity: dto.initialStock || 0,
          },
        },
      },
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  async findAllProducts(
    filters: ProductFilterDto,
  ): Promise<PaginatedResponse<unknown>> {
    const {
      page = 1,
      limit = 10,
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = ProductSortBy.CREATED_AT,
      sortOrder = 'desc',
      inStock,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(categoryId && { categoryId }),
      ...(minPrice !== undefined && { price: { gte: minPrice } }),
      ...(maxPrice !== undefined && {
        price: { ...(minPrice !== undefined ? { gte: minPrice } : {}), lte: maxPrice },
      }),
      ...(inStock && {
        inventory: {
          quantity: { gt: 0 },
        },
      }),
    };

    // Build orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: {
            select: {
              id: true,
              name: true,
            },
          },
          inventory: {
            select: {
              sku: true,
              quantity: true,
              reserved: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: products.map((product) => ({
        ...product,
        availableStock: product.inventory
          ? product.inventory.quantity - product.inventory.reserved
          : 0,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
      timestamp: new Date().toISOString(),
    };
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        inventory: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      ...product,
      availableStock: product.inventory
        ? product.inventory.quantity - product.inventory.reserved
        : 0,
    };
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.findProductById(id);

    if (dto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });

      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: {
        category: true,
        inventory: true,
      },
    });
  }

  async deleteProduct(id: string) {
    const product = await this.findProductById(id);

    // Check if product has pending orders
    const pendingOrders = await this.prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { in: ['PENDING', 'PAID'] },
        },
      },
    });

    if (pendingOrders > 0) {
      throw new ConflictException(
        'Cannot delete product with pending or paid orders',
      );
    }

    // Soft delete by setting isActive to false
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  private generateSku(productName: string): string {
    const prefix = productName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${prefix}-${timestamp}`;
  }
}
