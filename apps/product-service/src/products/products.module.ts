import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getKafkaClientConfig } from '../../../../libs/common/src/config/kafka.config';
import { KAFKA_CLIENT } from '../../../../libs/common/src/events/commerce-events';
import { ProductStockEventsPublisher } from './product-stock-events.publisher';
import { Product } from './product.entity';
import { ProductCacheService } from './product-cache.service';
import { ProductsController } from './products.controller';
import { ProductsEventsController } from './products-events.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product]),
    ClientsModule.register([
      getKafkaClientConfig(
        KAFKA_CLIENT,
        'product-service-producer',
        'product-service-producer-group',
      ),
    ]),
  ],
  controllers: [ProductsController, ProductsEventsController],
  providers: [
    ProductsService,
    ProductCacheService,
    ProductStockEventsPublisher,
  ],
})
export class ProductsModule {}
