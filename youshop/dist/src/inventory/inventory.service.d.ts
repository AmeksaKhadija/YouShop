import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockDto, AdjustStockDto, SetStockAlertDto } from './dto';
export interface StockReservation {
    productId: string;
    quantity: number;
}
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    findBySku(sku: string): Promise<{
        availableStock: number;
        product: {
            id: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
            isActive: boolean;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    }>;
    findByProductId(productId: string): Promise<{
        availableStock: number;
        product: {
            id: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
            isActive: boolean;
        };
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    }>;
    updateStock(sku: string, dto: UpdateStockDto): Promise<{
        product: {
            id: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    }>;
    adjustStock(sku: string, dto: AdjustStockDto): Promise<{
        product: {
            id: string;
            name: string;
            price: import("@prisma/client-runtime-utils").Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    }>;
    setLowStockAlert(sku: string, dto: SetStockAlertDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    }>;
    getLowStockProducts(): Promise<({
        product: {
            id: string;
            name: string;
            category: {
                id: string;
                name: string;
            };
            price: import("@prisma/client-runtime-utils").Decimal;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    })[]>;
    getOutOfStockProducts(): Promise<({
        product: {
            id: string;
            name: string;
            category: {
                id: string;
                name: string;
            };
            price: import("@prisma/client-runtime-utils").Decimal;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        quantity: number;
        reserved: number;
        lowStockAlert: number;
        productId: string;
    })[]>;
    reserveStock(items: StockReservation[]): Promise<void>;
    releaseStock(items: StockReservation[]): Promise<void>;
    confirmStockDeduction(items: StockReservation[]): Promise<void>;
    checkAvailability(items: StockReservation[]): Promise<{
        available: boolean;
        unavailableItems: string[];
    }>;
}
