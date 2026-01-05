import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SetStockAlertDto {
  @ApiProperty({ example: 10, description: 'Low stock alert threshold' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockAlert: number;
}
