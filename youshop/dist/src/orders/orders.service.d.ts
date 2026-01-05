import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';
import { PaginatedResponse } from '../common/interfaces';
export declare class OrdersService {
    private prisma;
    private inventoryService;
    private configService;
    private readonly taxRate;
    private readonly orderExpirationMs;
    constructor(prisma: PrismaService, inventoryService: InventoryService, configService: ConfigService);
    createOrder(userId: string, dto: CreateOrderDto): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    findUserOrders(userId: string, filters: OrderFilterDto): Promise<PaginatedResponse<unknown>>;
    findOrderById(orderId: string, userId?: string): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    cancelOrder(orderId: string, userId: string): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    processExpiredOrders(): Promise<{
        processedCount: number;
    }>;
    getAllOrders(filters: OrderFilterDto): Promise<PaginatedResponse<unknown>>;
    private validateStatusTransition;
    private generateOrderNumber;
    private formatOrderResponse;
}
