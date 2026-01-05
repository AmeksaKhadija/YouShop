import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateStockDto, AdjustStockDto, SetStockAlertDto } from './dto';

export interface StockReservation {
  productId: string;
  quantity: number;
}

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async findBySku(sku: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { sku },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException(`Inventory with SKU ${sku} not found`);
    }

    return {
      ...inventory,
      availableStock: inventory.quantity - inventory.reserved,
    };
  }

  async findByProductId(productId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
          },
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Product inventory not found');
    }

    return {
      ...inventory,
      availableStock: inventory.quantity - inventory.reserved,
    };
  }

  async updateStock(sku: string, dto: UpdateStockDto) {
    const inventory = await this.findBySku(sku);

    if (dto.quantity < inventory.reserved) {
      throw new BadRequestException(
        `Cannot set quantity below reserved amount (${inventory.reserved} units reserved)`,
      );
    }

    return this.prisma.inventory.update({
      where: { sku },
      data: { quantity: dto.quantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  async adjustStock(sku: string, dto: AdjustStockDto) {
    const inventory = await this.findBySku(sku);
    const newQuantity = inventory.quantity + dto.adjustment;

    if (newQuantity < 0) {
      throw new BadRequestException('Stock cannot be negative');
    }

    if (newQuantity < inventory.reserved) {
      throw new BadRequestException(
        `Cannot reduce stock below reserved amount (${inventory.reserved} units reserved)`,
      );
    }

    return this.prisma.inventory.update({
      where: { sku },
      data: { quantity: newQuantity },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
      },
    });
  }

  async setLowStockAlert(sku: string, dto: SetStockAlertDto) {
    await this.findBySku(sku);

    return this.prisma.inventory.update({
      where: { sku },
      data: { lowStockAlert: dto.lowStockAlert },
    });
  }

  async getLowStockProducts() {
    return this.prisma.inventory.findMany({
      where: {
        quantity: {
          lte: this.prisma.inventory.fields.lowStockAlert,
        },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async getOutOfStockProducts() {
    return this.prisma.inventory.findMany({
      where: {
        OR: [
          { quantity: 0 },
          {
            quantity: { lte: this.prisma.inventory.fields.reserved },
          },
        ],
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            price: true,
            isActive: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  // =====================
  // STOCK RESERVATION (for Orders)
  // =====================

  async reserveStock(items: StockReservation[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Inventory for product ${item.productId} not found`,
          );
        }

        const availableStock = inventory.quantity - inventory.reserved;

        if (availableStock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product ${item.productId}. Available: ${availableStock}, Requested: ${item.quantity}`,
          );
        }

        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            reserved: { increment: item.quantity },
          },
        });
      }
    });
  }

  async releaseStock(items: StockReservation[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (!inventory) {
          continue; // Skip if inventory doesn't exist
        }

        const newReserved = Math.max(0, inventory.reserved - item.quantity);

        await tx.inventory.update({
          where: { productId: item.productId },
          data: { reserved: newReserved },
        });
      }
    });
  }

  async confirmStockDeduction(items: StockReservation[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const inventory = await tx.inventory.findUnique({
          where: { productId: item.productId },
        });

        if (!inventory) {
          throw new NotFoundException(
            `Inventory for product ${item.productId} not found`,
          );
        }

        await tx.inventory.update({
          where: { productId: item.productId },
          data: {
            quantity: { decrement: item.quantity },
            reserved: { decrement: item.quantity },
          },
        });
      }
    });
  }

  async checkAvailability(
    items: StockReservation[],
  ): Promise<{ available: boolean; unavailableItems: string[] }> {
    const unavailableItems: string[] = [];

    for (const item of items) {
      const inventory = await this.prisma.inventory.findUnique({
        where: { productId: item.productId },
        include: { product: { select: { name: true } } },
      });

      if (!inventory) {
        unavailableItems.push(item.productId);
        continue;
      }

      const availableStock = inventory.quantity - inventory.reserved;
      if (availableStock < item.quantity) {
        unavailableItems.push(inventory.product.name);
      }
    }

    return {
      available: unavailableItems.length === 0,
      unavailableItems,
    };
  }
}
