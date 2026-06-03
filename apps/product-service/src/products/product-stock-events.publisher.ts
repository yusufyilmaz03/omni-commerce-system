import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import {
  CommerceTopics,
  KAFKA_CLIENT,
} from '../../../../libs/common/src/events/commerce-events';
import type { StockEventPayload } from '../../../../libs/common/src/events/commerce-events';

@Injectable()
export class ProductStockEventsPublisher implements OnModuleDestroy {
  constructor(
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishStockDecreased(payload: StockEventPayload): Promise<void> {
    await this.publish(CommerceTopics.StockDecreased, payload);
  }

  async publishStockFailed(payload: StockEventPayload): Promise<void> {
    await this.publish(CommerceTopics.StockFailed, payload);
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  private async publish(
    topic: string,
    payload: StockEventPayload,
  ): Promise<void> {
    await lastValueFrom(
      this.kafkaClient.emit(topic, {
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
  }
}
