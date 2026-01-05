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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const inventory_service_1 = require("../inventory/inventory.service");
let OrdersService = class OrdersService {
    prisma;
    inventoryService;
    configService;
    taxRate;
    orderExpirationMs;
    constructor(prisma, inventoryService, configService) {
        this.prisma = prisma;
        this.inventoryService = inventoryService;
        this.configService = configService;
        this.taxRate = this.configService.get('TAX_RATE', 0.2);
        this.orderExpirationMs = this.configService.get('ORDER_EXPIRATION_MS', 1800000);
    }
    async createOrder(userId, dto) {
        const productIds = dto.items.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: productIds },
                isActive: true,
            },
            include: {
                inventory: true,
            },
        });
        if (products.length !== productIds.length) {
            throw new common_1.BadRequestException('One or more products not found or inactive');
        }
        const stockItems = dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }));
        const availability = await this.inventoryService.checkAvailability(stockItems);
        if (!availability.available) {
            throw new common_1.BadRequestException(`Insufficient stock for: ${availability.unavailableItems.join(', ')}`);
        }
        const productMap = new Map(products.map((p) => [p.id, p]));
        let subtotal = 0;
        const orderItems = dto.items.map((item) => {
            const product = productMap.get(item.productId);
            const unitPrice = Number(product.price);
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;
            return {
                product: { connect: { id: item.productId } },
                quantity: item.quantity,
                unitPrice,
                totalPrice,
            };
        });
        const taxAmount = subtotal * this.taxRate;
        const totalAmount = subtotal + taxAmount;
        const orderNumber = this.generateOrderNumber();
        const expiresAt = new Date(Date.now() + this.orderExpirationMs);
        const order = await this.prisma.$transaction(async (tx) => {
            await this.inventoryService.reserveStock(stockItems);
            return tx.order.create({
                data: {
                    orderNumber,
                    user: { connect: { id: userId } },
                    subtotal,
                    taxAmount,
                    totalAmount,
                    expiresAt,
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                },
            });
        });
        return this.formatOrderResponse(order);
    }
    async findUserOrders(userId, filters) {
        const { page = 1, limit = 10, status } = filters;
        const skip = (page - 1) * limit;
        const where = {
            userId,
            ...(status && { status }),
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            success: true,
            data: orders.map((order) => this.formatOrderResponse(order)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async findOrderById(orderId, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (userId && order.userId !== userId) {
            throw new common_1.ForbiddenException('You can only view your own orders');
        }
        return this.formatOrderResponse(order);
    }
    async updateOrderStatus(orderId, dto) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        this.validateStatusTransition(order.status, dto.status);
        const stockItems = order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }));
        if (dto.status === client_1.OrderStatus.PAID) {
            await this.inventoryService.confirmStockDeduction(stockItems);
        }
        else if (dto.status === client_1.OrderStatus.CANCELLED) {
            await this.inventoryService.releaseStock(stockItems);
        }
        const updateData = {
            status: dto.status,
            ...(dto.status === client_1.OrderStatus.PAID && { paidAt: new Date() }),
        };
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: updateData,
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });
        return this.formatOrderResponse(updatedOrder);
    }
    async cancelOrder(orderId, userId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (order.userId !== userId) {
            throw new common_1.ForbiddenException('You can only cancel your own orders');
        }
        if (order.status !== client_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Only pending orders can be cancelled');
        }
        const stockItems = order.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
        }));
        await this.inventoryService.releaseStock(stockItems);
        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: client_1.OrderStatus.CANCELLED },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                imageUrl: true,
                            },
                        },
                    },
                },
            },
        });
        return this.formatOrderResponse(updatedOrder);
    }
    async processExpiredOrders() {
        const expiredOrders = await this.prisma.order.findMany({
            where: {
                status: client_1.OrderStatus.PENDING,
                expiresAt: { lt: new Date() },
            },
            include: { items: true },
        });
        for (const order of expiredOrders) {
            const stockItems = order.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            }));
            await this.inventoryService.releaseStock(stockItems);
            await this.prisma.order.update({
                where: { id: order.id },
                data: { status: client_1.OrderStatus.CANCELLED },
            });
        }
        return { processedCount: expiredOrders.length };
    }
    async getAllOrders(filters) {
        const { page = 1, limit = 10, status } = filters;
        const skip = (page - 1) * limit;
        const where = {
            ...(status && { status }),
        };
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    imageUrl: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            email: true,
                            firstName: true,
                            lastName: true,
                        },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        const totalPages = Math.ceil(total / limit);
        return {
            success: true,
            data: orders.map((order) => this.formatOrderResponse(order)),
            meta: {
                total,
                page,
                limit,
                totalPages,
            },
            timestamp: new Date().toISOString(),
        };
    }
    validateStatusTransition(currentStatus, newStatus) {
        const validTransitions = {
            [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.PAID, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PAID]: [client_1.OrderStatus.SHIPPED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.SHIPPED]: [client_1.OrderStatus.DELIVERED],
            [client_1.OrderStatus.DELIVERED]: [],
            [client_1.OrderStatus.CANCELLED]: [],
        };
        const allowed = validTransitions[currentStatus];
        if (!allowed.includes(newStatus)) {
            throw new common_1.BadRequestException(`Cannot transition from ${currentStatus} to ${newStatus}`);
        }
    }
    generateOrderNumber() {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `ORD-${timestamp}-${random}`;
    }
    formatOrderResponse(order) {
        return {
            ...order,
            subtotal: Number(order.subtotal),
            taxAmount: Number(order.taxAmount),
            totalAmount: Number(order.totalAmount),
            items: order.items?.map((item) => ({
                ...item,
                unitPrice: Number(item.unitPrice),
                totalPrice: Number(item.totalPrice),
            })),
        };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_service_1.InventoryService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map