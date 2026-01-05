import { InventoryService } from './inventory.service';
import { UpdateStockDto, AdjustStockDto, SetStockAlertDto } from './dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
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
}
