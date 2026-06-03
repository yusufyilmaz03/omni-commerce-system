import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderServiceController } from './order-service.controller';
import { OrderServiceService } from './order-service.service';
import { OrdersModule } from './orders/orders.module';

import { getDatabaseConfig } from '../../../libs/common/src';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/order-service/.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig('ORDER')),
    OrdersModule,
  ],
  controllers: [OrderServiceController],
  providers: [OrderServiceService],
})
export class OrderServiceModule {}
