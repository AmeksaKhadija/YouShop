import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable()
export class SimpleCacheInterceptor implements NestInterceptor {
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly ttl = 60000; // 1 minute cache

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    // Only cache GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.cache.get(cacheKey);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return of(cachedResponse.data);
    }

    return next.handle().pipe(
      tap((data) => {
        this.cache.set(cacheKey, {
          data,
          expiry: Date.now() + this.ttl,
        });
      }),
    );
  }

  private generateCacheKey(request: { url: string; query: Record<string, unknown> }): string {
    return `${request.url}:${JSON.stringify(request.query)}`;
  }

  clearCache(): void {
    this.cache.clear();
  }
}
