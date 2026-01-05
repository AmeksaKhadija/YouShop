"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dto_1 = require("./dto");
let CatalogService = class CatalogService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCategory(dto) {
        const existing = await this.prisma.category.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.ConflictException('Category with this name already exists');
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
    async findCategoryById(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
            },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async updateCategory(id, dto) {
        await this.findCategoryById(id);
        if (dto.name) {
            const existing = await this.prisma.category.findFirst({
                where: {
                    name: dto.name,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new common_1.ConflictException('Category with this name already exists');
            }
        }
        return this.prisma.category.update({
            where: { id },
            data: dto,
        });
    }
    async deleteCategory(id) {
        await this.findCategoryById(id);
        const productsCount = await this.prisma.product.count({
            where: { categoryId: id },
        });
        if (productsCount > 0) {
            throw new common_1.ConflictException('Cannot delete category with existing products');
        }
        return this.prisma.category.delete({
            where: { id },
        });
    }
    async createProduct(dto) {
        const category = await this.prisma.category.findUnique({
            where: { id: dto.categoryId },
        });
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        const sku = dto.sku || this.generateSku(dto.name);
        const existingSku = await this.prisma.inventory.findUnique({
            where: { sku },
        });
        if (existingSku) {
            throw new common_1.ConflictException('Product with this SKU already exists');
        }
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
    async findAllProducts(filters) {
        const { page = 1, limit = 10, search, categoryId, minPrice, maxPrice, sortBy = dto_1.ProductSortBy.CREATED_AT, sortOrder = 'desc', inStock, } = filters;
        const skip = (page - 1) * limit;
        const where = {
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
        const orderBy = {
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
    async findProductById(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                inventory: true,
            },
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found');
        }
        return {
            ...product,
            availableStock: product.inventory
                ? product.inventory.quantity - product.inventory.reserved
                : 0,
        };
    }
    async updateProduct(id, dto) {
        await this.findProductById(id);
        if (dto.categoryId) {
            const category = await this.prisma.category.findUnique({
                where: { id: dto.categoryId },
            });
            if (!category) {
                throw new common_1.NotFoundException('Category not found');
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
    async deleteProduct(id) {
        const product = await this.findProductById(id);
        const pendingOrders = await this.prisma.orderItem.count({
            where: {
                productId: id,
                order: {
                    status: { in: ['PENDING', 'PAID'] },
                },
            },
        });
        if (pendingOrders > 0) {
            throw new common_1.ConflictException('Cannot delete product with pending or paid orders');
        }
        return this.prisma.product.update({
            where: { id },
            data: { isActive: false },
        });
    }
    generateSku(productName) {
        const prefix = productName
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 6);
        const timestamp = Date.now().toString(36).toUpperCase();
        return `${prefix}-${timestamp}`;
    }
};
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map