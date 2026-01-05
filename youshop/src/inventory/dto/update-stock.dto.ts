import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStockDto {
  @ApiProperty({ example: 50, description: 'New quantity to set' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'Stock replenishment from supplier' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdjustStockDto {
  @ApiProperty({ example: 10, description: 'Amount to add (positive) or remove (negative)' })
  @Type(() => Number)
  @IsInt()
  adjustment: number;

  @ApiPropertyOptional({ example: 'Manual adjustment after inventory count' })
  @IsOptional()
  @IsString()
  reason?: string;
}
