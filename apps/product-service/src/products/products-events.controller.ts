import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { CommerceTopics } from '../../../../libs/common/src/events/commerce-events';
import type {
  CommerceEvent,
  OrderEventPayload,
} from '../../../../libs/common/src/events/commerce-events';

import { ProductStockEventsPublisher } from './product-stock-events.publisher';
import { ProductsService } from './products.service';

@Controller()
export class ProductsEventsController {
  private readonly logger = new Logger(ProductsEventsController.name);

  constructor(
    private readonly productsService: ProductsService,
    private readonly productStockEventsPublisher: ProductStockEventsPublisher,
  ) {}

  @EventPattern(CommerceTopics.OrderCompleted)
  async handleOrderCompleted(
    @Payload() event: CommerceEvent<OrderEventPayload>,
  ): Promise<void> {
    try {
      await this.productsService.decreaseStockForOrder(
        event.payload.orderId,
        event.payload.items,
      );
      await this.productStockEventsPublisher.publishStockDecreased({
        items: event.payload.items,
        orderId: event.payload.orderId,
      });
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : 'Unknown stock failure';

      this.logger.error(
        JSON.stringify({
          error: failureReason,
          event: CommerceTopics.OrderCompleted,
          orderId: event.payload.orderId,
        }),
      );

      await this.productStockEventsPublisher.publishStockFailed({
        failureReason,
        items: event.payload.items,
        orderId: event.payload.orderId,
      });
    }
  }
}
