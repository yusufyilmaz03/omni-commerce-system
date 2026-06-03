import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

import { CommerceTopics } from '../../../../libs/common/src/events/commerce-events';
import type {
  CommerceEvent,
  OrderEventPayload,
} from '../../../../libs/common/src/events/commerce-events';
import { PaymentsService } from './payments.service';

@Controller()
export class PaymentsEventsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @EventPattern(CommerceTopics.OrderCreated)
  async handleOrderCreated(
    @Payload() event: CommerceEvent<OrderEventPayload>,
  ): Promise<void> {
    await this.paymentsService.processPayment({
      amount: Number(event.payload.totalAmount),
      orderId: event.payload.orderId,
      shouldFail: false,
      userId: event.payload.userId,
    });
  }
}
