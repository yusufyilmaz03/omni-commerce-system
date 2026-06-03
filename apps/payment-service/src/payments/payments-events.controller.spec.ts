import type {
  CommerceEvent,
  OrderEventPayload,
} from '../../../../libs/common/src/events/commerce-events';
import { PaymentsEventsController } from './payments-events.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsEventsController', () => {
  it('processes payment requests from order.created events', async () => {
    const paymentsService: jest.Mocked<
      Pick<PaymentsService, 'processPayment'>
    > = {
      processPayment: jest.fn(),
    };
    const controller = new PaymentsEventsController(
      paymentsService as unknown as PaymentsService,
    );
    const event: CommerceEvent<OrderEventPayload> = {
      occurredAt: '2026-01-01T00:00:00.000Z',
      payload: {
        items: [{ productId: 'product-1', quantity: 2 }],
        orderId: 'order-1',
        status: 'CREATED',
        totalAmount: '50.00',
        userId: 'user-1',
      },
    };

    paymentsService.processPayment.mockResolvedValue({} as never);

    await controller.handleOrderCreated(event);

    expect(paymentsService.processPayment).toHaveBeenCalledWith({
      amount: 50,
      orderId: 'order-1',
      shouldFail: false,
      userId: 'user-1',
    });
  });
});
