import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  getKafkaClientConfig,
  KAFKA_CLIENT,
} from '../../../../libs/common/src';
import { InventoryGateway } from './gateways/inventory.gateway';
import { OrderEventsPublisher } from './gateways/order-events.publisher';
import { PaymentGateway } from './gateways/payment.gateway';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order]),
    ClientsModule.register([
      getKafkaClientConfig(
        KAFKA_CLIENT,
        'order-service-producer',
        'order-service-producer-group',
      ),
    ]),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    InventoryGateway,
    PaymentGateway,
    OrderEventsPublisher,
  ],
})
export class OrdersModule {}
