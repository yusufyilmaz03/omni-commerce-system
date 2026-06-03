import type {
  CommerceEvent,
  OrderEventPayload,
} from '../../../../libs/common/src/events/commerce-events';

import { ProductStockEventsPublisher } from './product-stock-events.publisher';
import { ProductsEventsController } from './products-events.controller';
import { ProductsService } from './products.service';

describe('ProductsEventsController', () => {
  let controller: ProductsEventsController;
  let productsService: jest.Mocked<
    Pick<ProductsService, 'decreaseStockForOrder'>
  >;
  let publisher: jest.Mocked<
    Pick<
      ProductStockEventsPublisher,
      'publishStockDecreased' | 'publishStockFailed'
    >
  >;

  const event: CommerceEvent<OrderEventPayload> = {
    occurredAt: '2026-01-01T00:00:00.000Z',
    payload: {
      items: [{ productId: 'product-1', quantity: 2 }],
      orderId: 'order-1',
      status: 'COMPLETED',
      totalAmount: '50.00',
      userId: 'user-1',
    },
  };

  beforeEach(() => {
    productsService = {
      decreaseStockForOrder: jest.fn(),
    };
    publisher = {
      publishStockDecreased: jest.fn(),
      publishStockFailed: jest.fn(),
    };
    productsService.decreaseStockForOrder.mockResolvedValue([]);
    publisher.publishStockDecreased.mockResolvedValue(undefined);
    publisher.publishStockFailed.mockResolvedValue(undefined);

    controller = new ProductsEventsController(
      productsService as unknown as ProductsService,
      publisher as unknown as ProductStockEventsPublisher,
    );
  });

  it('decreases stock and publishes stock.decreased', async () => {
    await controller.handleOrderCompleted(event);

    expect(productsService.decreaseStockForOrder).toHaveBeenCalledWith(
      'order-1',
      event.payload.items,
    );
    expect(publisher.publishStockDecreased).toHaveBeenCalledWith({
      items: event.payload.items,
      orderId: 'order-1',
    });
  });

  it('publishes stock.failed when stock decrease fails', async () => {
    productsService.decreaseStockForOrder.mockRejectedValueOnce(
      new Error('not enough stock'),
    );

    await controller.handleOrderCompleted(event);

    expect(publisher.publishStockFailed).toHaveBeenCalledWith({
      failureReason: 'not enough stock',
      items: event.payload.items,
      orderId: 'order-1',
    });
  });
});
