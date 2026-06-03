import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

import {
  CommerceTopics,
  KAFKA_CLIENT,
} from '../../../../libs/common/src/events/commerce-events';
import type { PaymentEventPayload } from '../../../../libs/common/src/events/commerce-events';

@Injectable()
export class PaymentEventsPublisher implements OnModuleDestroy {
  constructor(
    @Inject(KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async publishPaymentSucceeded(payload: PaymentEventPayload): Promise<void> {
    await this.publish(CommerceTopics.PaymentSucceeded, payload);
  }

  async publishPaymentFailed(payload: PaymentEventPayload): Promise<void> {
    await this.publish(CommerceTopics.PaymentFailed, payload);
  }

  async onModuleDestroy(): Promise<void> {
    await this.kafkaClient.close();
  }

  private async publish(
    topic: string,
    payload: PaymentEventPayload,
  ): Promise<void> {
    await lastValueFrom(
      this.kafkaClient.emit(topic, {
        occurredAt: new Date().toISOString(),
        payload,
      }),
    );
  }
}
