import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../../common/dto';
export declare class OrderFilterDto extends PaginationDto {
    status?: OrderStatus;
}
