import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateCheckoutDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Order ID to create checkout session for',
  })
  @IsUUID()
  @IsNotEmpty()
  orderId: string;
}
