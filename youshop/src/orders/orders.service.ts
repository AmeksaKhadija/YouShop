import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';
import { PaginatedResponse } from '../common/interfaces';

@Injectable()
export class OrdersService {
  private readonly taxRate: number;
  private readonly orderExpirationMs: number;

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
    private configService: ConfigService,
  ) {
    this.taxRate = this.configService.get<number>('TAX_RATE', 0.2);
    this.orderExpirationMs = this.configService.get<number>(
      'ORDER_EXPIRATION_MS',
      1800000,
    ); // 30 minutes
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    // Get all products and verify they exist and are active
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
      throw new BadRequestException('One or more products not found or inactive');
    }

    // Check stock availability
    const stockItems = dto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const availability = await this.inventoryService.checkAvailability(stockItems);
    if (!availability.available) {
      throw new BadRequestException(
        `Insufficient stock for: ${availability.unavailableItems.join(', ')}`,
      );
    }

    // Calculate prices
    type ProductWithInventory = typeof products[0];
    const productMap = new Map<string, ProductWithInventory>(products.map((p) => [p.id, p]));
    let subtotal = 0;

    const orderItems = dto.items.map((item) => {
      const product = productMap.get(item.productId)!;
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

    // Generate order number
    const orderNumber = this.generateOrderNumber();

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + this.orderExpirationMs);

    // Create order and reserve stock in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Reserve stock
      await this.inventoryService.reserveStock(stockItems);

      // Create order
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

  async findUserOrders(
    userId: string,
    filters: OrderFilterDto,
  ): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
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

  async findOrderById(orderId: string, userId?: string) {
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
      throw new NotFoundException('Order not found');
    }

    // If userId is provided, verify ownership (for clients)
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return this.formatOrderResponse(order);
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Validate status transition
    this.validateStatusTransition(order.status, dto.status);

    // Handle stock operations based on status change
    const stockItems = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    if (dto.status === OrderStatus.PAID) {
      // Confirm stock deduction (remove from inventory)
      await this.inventoryService.confirmStockDeduction(stockItems);
    } else if (dto.status === OrderStatus.CANCELLED) {
      // Release reserved stock
      await this.inventoryService.releaseStock(stockItems);
    }

    const updateData: Prisma.OrderUpdateInput = {
      status: dto.status,
      ...(dto.status === OrderStatus.PAID && { paidAt: new Date() }),
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

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    // Release stock
    const stockItems = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    await this.inventoryService.releaseStock(stockItems);

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
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
        status: OrderStatus.PENDING,
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
        data: { status: OrderStatus.CANCELLED },
      });
    }

    return { processedCount: expiredOrders.length };
  }

  async getAllOrders(filters: OrderFilterDto): Promise<PaginatedResponse<unknown>> {
    const { page = 1, limit = 10, status } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
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

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ) {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = validTransitions[currentStatus];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  private formatOrderResponse(order: Record<string, unknown>) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      totalAmount: Number(order.totalAmount),
      items: (order.items as Array<Record<string, unknown>>)?.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
    };
  }
}
