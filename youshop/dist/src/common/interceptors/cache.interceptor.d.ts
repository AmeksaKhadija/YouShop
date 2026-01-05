import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class SimpleCacheInterceptor implements NestInterceptor {
    private cache;
    private readonly ttl;
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
    private generateCacheKey;
    clearCache(): void;
}
