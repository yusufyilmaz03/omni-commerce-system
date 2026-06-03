import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getDatabaseConfig } from '../../../libs/common/src';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/product-service/.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig('PRODUCT')),
    ProductsModule,
  ],
})
export class ProductServiceModule {}
