import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  Headers,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import { CreateCheckoutDto } from './dto';
import { CurrentUser, Public } from '../common/decorators';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe checkout session for an order' })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created',
    schema: {
      properties: {
        sessionId: { type: 'string' },
        url: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Order cannot be paid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async createCheckout(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCheckoutDto,
  ): Promise<{ sessionId: string; url: string }> {
    return this.paymentService.createCheckoutSession(dto.orderId, userId);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available');
    }
    await this.paymentService.handleWebhook(rawBody, signature);
    return { received: true };
  }

  @Get('order/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment details for an order' })
  @ApiParam({ name: 'orderId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Payment details' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentByOrder(
    @CurrentUser('id') userId: string,
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<unknown> {
    return this.paymentService.getPaymentByOrderId(orderId, userId);
  }

  @Get('history')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment history for current user' })
  @ApiResponse({ status: 200, description: 'Payment history' })
  async getPaymentHistory(@CurrentUser('id') userId: string): Promise<unknown[]> {
    return this.paymentService.getPaymentHistory(userId);
  }
}
