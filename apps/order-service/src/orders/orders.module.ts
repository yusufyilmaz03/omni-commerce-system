import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { InventoryGateway } from './gateways/inventory.gateway';
import { OrderEventsPublisher } from './gateways/order-events.publisher';
import { PaymentGateway } from './gateways/payment.gateway';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    InventoryGateway,
    PaymentGateway,
    OrderEventsPublisher,
  ],
})
export class OrdersModule {}
