import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto, CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';
import { PaginatedResponse } from '../common/interfaces';
export declare class CatalogService {
    private prisma;
    constructor(prisma: PrismaService);
    createCategory(dto: CreateCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
    }>;
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
        price: Prisma.Decimal;
        imageUrl: string | null;
        isActive: boolean;
        categoryId: string;
    }>;
    findAllProducts(filters: ProductFilterDto): Promise<PaginatedResponse<unknown>>;
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
        price: Prisma.Decimal;
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
        price: Prisma.Decimal;
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
        price: Prisma.Decimal;
        imageUrl: string | null;
        isActive: boolean;
        categoryId: string;
    }>;
    private generateSku;
}
