import { PaginationDto } from '../../common/dto';
export declare enum ProductSortBy {
    NAME = "name",
    PRICE = "price",
    CREATED_AT = "createdAt"
}
export declare enum SortOrder {
    ASC = "asc",
    DESC = "desc"
}
export declare class ProductFilterDto extends PaginationDto {
    search?: string;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: ProductSortBy;
    sortOrder?: SortOrder;
    inStock?: boolean;
}
