"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
const inventory_service_1 = require("./inventory.service");
const dto_1 = require("./dto");
const decorators_1 = require("../common/decorators");
let InventoryController = class InventoryController {
    inventoryService;
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async findBySku(sku) {
        return this.inventoryService.findBySku(sku);
    }
    async updateStock(sku, dto) {
        return this.inventoryService.updateStock(sku, dto);
    }
    async adjustStock(sku, dto) {
        return this.inventoryService.adjustStock(sku, dto);
    }
    async setLowStockAlert(sku, dto) {
        return this.inventoryService.setLowStockAlert(sku, dto);
    }
    async getLowStockProducts() {
        return this.inventoryService.getLowStockProducts();
    }
    async getOutOfStockProducts() {
        return this.inventoryService.getOutOfStockProducts();
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('sku/:sku'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get inventory by SKU (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Inventory details' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory not found' }),
    __param(0, (0, common_1.Param)('sku')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "findBySku", null);
__decorate([
    (0, common_1.Put)('sku/:sku'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update stock quantity by SKU (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stock updated successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid quantity' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory not found' }),
    __param(0, (0, common_1.Param)('sku')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateStockDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateStock", null);
__decorate([
    (0, common_1.Patch)('sku/:sku/adjust'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Adjust stock by delta value (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stock adjusted successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid adjustment' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory not found' }),
    __param(0, (0, common_1.Param)('sku')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AdjustStockDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "adjustStock", null);
__decorate([
    (0, common_1.Patch)('sku/:sku/alert'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Set low stock alert threshold (Admin only)' }),
    (0, swagger_1.ApiParam)({ name: 'sku', type: 'string', example: 'IPHONE-15-PRO-256' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Alert threshold updated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Inventory not found' }),
    __param(0, (0, common_1.Param)('sku')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SetStockAlertDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "setLowStockAlert", null);
__decorate([
    (0, common_1.Get)('low-stock'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get products with low stock (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of low stock products' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getLowStockProducts", null);
__decorate([
    (0, common_1.Get)('out-of-stock'),
    (0, decorators_1.Roles)(client_1.Role.ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Get out of stock products (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'List of out of stock products' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "getOutOfStockProducts", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, common_1.Controller)('inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map