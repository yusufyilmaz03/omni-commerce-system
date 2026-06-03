import { Injectable, Logger } from '@nestjs/common';

import { Order } from '../order.entity';

export type OrderEventName =
  | 'order.completed'
  | 'order.created'
  | 'order.failed';

@Injectable()
export class OrderEventsPublisher {
  private readonly logger = new Logger(OrderEventsPublisher.name);

  publish(eventName: OrderEventName, order: Order): Promise<void> {
    this.logger.log(
      JSON.stringify({
        event: eventName,
        orderId: order.id,
        status: order.status,
      }),
    );

    return Promise.resolve();
  }
}
