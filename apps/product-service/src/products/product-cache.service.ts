import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

import { Product } from './product.entity';

@Injectable()
export class ProductCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly productListKey = 'products:list';
  private readonly ttlSeconds = 60;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST ?? 'localhost',
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      port: Number(process.env.REDIS_PORT ?? 6379),
    });
  }

  async getProductList(): Promise<Product[] | null> {
    const cachedProducts = await this.withRedis(() =>
      this.redis.get(this.productListKey),
    );

    if (!cachedProducts) {
      return null;
    }

    return JSON.parse(cachedProducts) as Product[];
  }

  async setProductList(products: Product[]): Promise<void> {
    await this.withRedis(() =>
      this.redis.set(
        this.productListKey,
        JSON.stringify(products),
        'EX',
        this.ttlSeconds,
      ),
    );
  }

  async deleteProductList(): Promise<void> {
    await this.withRedis(() => this.redis.del(this.productListKey));
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  private async withRedis<T>(operation: () => Promise<T>): Promise<T | null> {
    try {
      if (this.redis.status === 'wait') {
        await this.redis.connect();
      }

      return await operation();
    } catch {
      return null;
    }
  }
}
