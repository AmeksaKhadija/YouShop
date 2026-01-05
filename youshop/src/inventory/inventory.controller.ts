import {
  Controller,
  Get,
  Put,
  Patch,
  Body,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { InventoryService } from './inventory.service';
import { UpdateStockDto, AdjustStockDto, SetStockAlertDto } from './dto';
import { Roles } from '../common/decorators';

@ApiTags('Inventory')
@Controller('inventory')
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('sku/:sku')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get inventory by SKU (Admin only)' })
  @ApiParam({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' })
  @ApiResponse({ status: 200, description: 'Inventory details' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async findBySku(@Param('sku') sku: string) {
    return this.inventoryService.findBySku(sku);
  }

  @Put('sku/:sku')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update stock quantity by SKU (Admin only)' })
  @ApiParam({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' })
  @ApiResponse({ status: 200, description: 'Stock updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid quantity' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async updateStock(
    @Param('sku') sku: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(sku, dto);
  }

  @Patch('sku/:sku/adjust')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Adjust stock by delta value (Admin only)' })
  @ApiParam({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid adjustment' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async adjustStock(
    @Param('sku') sku: string,
    @Body() dto: AdjustStockDto,
  ) {
    return this.inventoryService.adjustStock(sku, dto);
  }

  @Patch('sku/:sku/alert')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Set low stock alert threshold (Admin only)' })
  @ApiParam({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' })
  @ApiResponse({ status: 200, description: 'Alert threshold updated' })
  @ApiResponse({ status: 404, description: 'Inventory not found' })
  async setLowStockAlert(
    @Param('sku') sku: string,
    @Body() dto: SetStockAlertDto,
  ) {
    return this.inventoryService.setLowStockAlert(sku, dto);
  }

  @Get('low-stock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get products with low stock (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of low stock products' })
  async getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  @Get('out-of-stock')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get out of stock products (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of out of stock products' })
  async getOutOfStockProducts() {
    return this.inventoryService.getOutOfStockProducts();
  }
}
