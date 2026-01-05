import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(userId: string, dto: CreateOrderDto): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    findMyOrders(userId: string, filters: OrderFilterDto): Promise<import("../common/interfaces").PaginatedResponse<unknown>>;
    findMyOrderById(userId: string, orderId: string): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    cancelMyOrder(userId: string, orderId: string): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        items: {
            unitPrice: number;
            totalPrice: number;
        }[];
    }>;
    findAllOrders(filters: OrderFilterDto): Promise<import("../common/interfaces").PaginatedResponse<unknown>>;
    findOrderById(orderId: string): Promise<{
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
    processExpiredOrders(): Promise<{
        processedCount: number;
    }>;
}
