"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleCacheInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let SimpleCacheInterceptor = class SimpleCacheInterceptor {
    cache = new Map();
    ttl = 60000;
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        if (request.method !== 'GET') {
            return next.handle();
        }
        const cacheKey = this.generateCacheKey(request);
        const cachedResponse = this.cache.get(cacheKey);
        if (cachedResponse && cachedResponse.expiry > Date.now()) {
            return (0, rxjs_1.of)(cachedResponse.data);
        }
        return next.handle().pipe((0, operators_1.tap)((data) => {
            this.cache.set(cacheKey, {
                data,
                expiry: Date.now() + this.ttl,
            });
        }));
    }
    generateCacheKey(request) {
        return `${request.url}:${JSON.stringify(request.query)}`;
    }
    clearCache() {
        this.cache.clear();
    }
};
exports.SimpleCacheInterceptor = SimpleCacheInterceptor;
exports.SimpleCacheInterceptor = SimpleCacheInterceptor = __decorate([
    (0, common_1.Injectable)()
], SimpleCacheInterceptor);
//# sourceMappingURL=cache.interceptor.js.map