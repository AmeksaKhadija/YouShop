import { CatalogService } from './catalog.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
export declare class CatalogController {
    private readonly catalogService;
    constructor(catalogService: CatalogService);
    findAllCategories(): Promise<({
        _count: {
            products: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    })[]>;
    findCategoryById(id: string): Promise<{
        _count: {
            products: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    createCategory(dto: CreateCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    updateCategory(id: string, dto: UpdateCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    deleteCategory(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
    findAllProducts(filters: ProductFilterDto): Promise<import("../common/interfaces").PaginatedResponse<unknown>>;
    findProductById(id: string): Promise<{
        availableStock: number;
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        inventory: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            quantity: number;
            reserved: number;
            lowStockAlert: number;
            productId: string;
        } | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        imageUrl: string | null;
        isActive: boolean;
        categoryId: string;
    }>;
    createProduct(dto: CreateProductDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        inventory: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            quantity: number;
            reserved: number;
            lowStockAlert: number;
            productId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        imageUrl: string | null;
        isActive: boolean;
        categoryId: string;
    }>;
    updateProduct(id: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        };
        inventory: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            quantity: number;
            reserved: number;
            lowStockAlert: number;
            productId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        imageUrl: string | null;
        isActive: boolean;
        categoryId: string;
    }>;
    deleteProduct(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        imageUrl: string | null;
        isActive: boolean;
        categoryId: string;
    }>;
}
