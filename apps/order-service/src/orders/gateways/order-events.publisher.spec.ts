import { of } from 'rxjs';

import { CommerceTopics } from '../../../../../libs/common/src/events/commerce-events';
import { Order } from '../order.entity';
import { OrderStatus } from '../order-status.enum';
import { OrderEventsPublisher } from './order-events.publisher';

describe('OrderEventsPublisher', () => {
  it('emits order events to Kafka with a normalized payload', async () => {
    const kafkaClient = {
      close: jest.fn(),
      emit: jest.fn(),
    };
    const publisher = new OrderEventsPublisher(kafkaClient as never);
    const order: Order = {
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      id: 'order-1',
      items: [{ productId: 'product-1', quantity: 2, unitPrice: 25 }],
      status: OrderStatus.Completed,
      totalAmount: '50.00',
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      userId: 'user-1',
    };

    kafkaClient.emit.mockReturnValue(of(null));

    await publisher.publish('order.completed', order);

    expect(kafkaClient.emit).toHaveBeenCalledWith(
      CommerceTopics.OrderCompleted,
      expect.objectContaining({
        payload: {
          failureReason: undefined,
          items: [{ productId: 'product-1', quantity: 2 }],
          orderId: 'order-1',
          status: OrderStatus.Completed,
          totalAmount: '50.00',
          userId: 'user-1',
        },
      }),
    );
  });
});
