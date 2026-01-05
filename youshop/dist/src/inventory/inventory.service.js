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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findBySku(sku) {
        const inventory = await this.prisma.inventory.findUnique({
            where: { sku },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!inventory) {
            throw new common_1.NotFoundException(`Inventory with SKU ${sku} not found`);
        }
        return {
            ...inventory,
            availableStock: inventory.quantity - inventory.reserved,
        };
    }
    async findByProductId(productId) {
        const inventory = await this.prisma.inventory.findUnique({
            where: { productId },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        isActive: true,
                    },
                },
            },
        });
        if (!inventory) {
            throw new common_1.NotFoundException('Product inventory not found');
        }
        return {
            ...inventory,
            availableStock: inventory.quantity - inventory.reserved,
        };
    }
    async updateStock(sku, dto) {
        const inventory = await this.findBySku(sku);
        if (dto.quantity < inventory.reserved) {
            throw new common_1.BadRequestException(`Cannot set quantity below reserved amount (${inventory.reserved} units reserved)`);
        }
        return this.prisma.inventory.update({
            where: { sku },
            data: { quantity: dto.quantity },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
            },
        });
    }
    async adjustStock(sku, dto) {
        const inventory = await this.findBySku(sku);
        const newQuantity = inventory.quantity + dto.adjustment;
        if (newQuantity < 0) {
            throw new common_1.BadRequestException('Stock cannot be negative');
        }
        if (newQuantity < inventory.reserved) {
            throw new common_1.BadRequestException(`Cannot reduce stock below reserved amount (${inventory.reserved} units reserved)`);
        }
        return this.prisma.inventory.update({
            where: { sku },
            data: { quantity: newQuantity },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                    },
                },
            },
        });
    }
    async setLowStockAlert(sku, dto) {
        await this.findBySku(sku);
        return this.prisma.inventory.update({
            where: { sku },
            data: { lowStockAlert: dto.lowStockAlert },
        });
    }
    async getLowStockProducts() {
        return this.prisma.inventory.findMany({
            where: {
                quantity: {
                    lte: this.prisma.inventory.fields.lowStockAlert,
                },
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        isActive: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: { quantity: 'asc' },
        });
    }
    async getOutOfStockProducts() {
        return this.prisma.inventory.findMany({
            where: {
                OR: [
                    { quantity: 0 },
                    {
                        quantity: { lte: this.prisma.inventory.fields.reserved },
                    },
                ],
            },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        isActive: true,
                        category: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });
    }
    async reserveStock(items) {
        await this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                const inventory = await tx.inventory.findUnique({
                    where: { productId: item.productId },
                });
                if (!inventory) {
                    throw new common_1.NotFoundException(`Inventory for product ${item.productId} not found`);
                }
                const availableStock = inventory.quantity - inventory.reserved;
                if (availableStock < item.quantity) {
                    throw new common_1.BadRequestException(`Insufficient stock for product ${item.productId}. Available: ${availableStock}, Requested: ${item.quantity}`);
                }
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: {
                        reserved: { increment: item.quantity },
                    },
                });
            }
        });
    }
    async releaseStock(items) {
        await this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                const inventory = await tx.inventory.findUnique({
                    where: { productId: item.productId },
                });
                if (!inventory) {
                    continue;
                }
                const newReserved = Math.max(0, inventory.reserved - item.quantity);
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: { reserved: newReserved },
                });
            }
        });
    }
    async confirmStockDeduction(items) {
        await this.prisma.$transaction(async (tx) => {
            for (const item of items) {
                const inventory = await tx.inventory.findUnique({
                    where: { productId: item.productId },
                });
                if (!inventory) {
                    throw new common_1.NotFoundException(`Inventory for product ${item.productId} not found`);
                }
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: {
                        quantity: { decrement: item.quantity },
                        reserved: { decrement: item.quantity },
                    },
                });
            }
        });
    }
    async checkAvailability(items) {
        const unavailableItems = [];
        for (const item of items) {
            const inventory = await this.prisma.inventory.findUnique({
                where: { productId: item.productId },
                include: { product: { select: { name: true } } },
            });
            if (!inventory) {
                unavailableItems.push(item.productId);
                continue;
            }
            const availableStock = inventory.quantity - inventory.reserved;
            if (availableStock < item.quantity) {
                unavailableItems.push(inventory.product.name);
            }
        }
        return {
            available: unavailableItems.length === 0,
            unavailableItems,
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map