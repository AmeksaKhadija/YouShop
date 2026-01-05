import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto, OrderFilterDto } from './dto';
import { CurrentUser, Roles } from '../common/decorators';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // =====================
  // CLIENT ENDPOINTS
  // =====================

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid items or insufficient stock' })
  async createOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get('my-orders')
  @ApiOperation({ summary: 'Get current user orders' })
  @ApiResponse({ status: 200, description: 'List of user orders' })
  async findMyOrders(
    @CurrentUser('id') userId: string,
    @Query() filters: OrderFilterDto,
  ) {
    return this.ordersService.findUserOrders(userId, filters);
  }

  @Get('my-orders/:id')
  @ApiOperation({ summary: 'Get order details (own orders only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 403, description: 'Cannot view other user orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findMyOrderById(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.findOrderById(orderId, userId);
  }

  @Patch('my-orders/:id/cancel')
  @ApiOperation({ summary: 'Cancel own pending order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Order cannot be cancelled' })
  @ApiResponse({ status: 403, description: 'Cannot cancel other user orders' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async cancelMyOrder(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) orderId: string,
  ) {
    return this.ordersService.cancelOrder(orderId, userId);
  }

  // =====================
  // ADMIN ENDPOINTS
  // =====================

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all orders' })
  async findAllOrders(@Query() filters: OrderFilterDto) {
    return this.ordersService.getAllOrders(filters);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get any order by ID (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOrderById(@Param('id', ParseUUIDPipe) orderId: string) {
    return this.ordersService.findOrderById(orderId);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(orderId, dto);
  }

  @Post('process-expired')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Process and cancel expired orders (Admin only)' })
  @ApiResponse({ status: 200, description: 'Expired orders processed' })
  async processExpiredOrders() {
    return this.ordersService.processExpiredOrders();
  }
}
