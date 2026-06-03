import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import {
  CommerceTopics,
  KAFKA_CLIENT,
} from '../../../../../libs/common/src/events/commerce-events';
import type { OrderEventPayload } from '../../../../../libs/common/src/events/commerce-events';
import { Order } from '../order.entity';

export type OrderEventName =
  | 'order.completed'
  | 'order.created'
  | 'order.failed';

@Injectable()
export class OrderEventsPublisher implements OnModuleDestroy {
  private readonly logger = new Logger(OrderEventsPublisher.name);

  constructor(
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publish(eventName: OrderEventName, order: Order): Promise<void> {
    const payload: OrderEventPayload = {
      failureReason: order.failureReason,
      items: order.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      orderId: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      userId: order.userId,
    };

    this.logger.log(
      JSON.stringify({
        event: eventName,
        orderId: order.id,
        status: order.status,
      }),
    );

    await lastValueFrom(
      this.kafkaClient.emit(CommerceTopics[this.toTopicKey(eventName)], {
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  private toTopicKey(
    eventName: OrderEventName,
  ): 'OrderCompleted' | 'OrderCreated' | 'OrderFailed' {
    const topicKeys = {
      'order.completed': 'OrderCompleted',
      'order.created': 'OrderCreated',
      'order.failed': 'OrderFailed',
    } as const;

    return topicKeys[eventName];
  }
}
