import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryGateway } from './gateways/inventory.gateway';
import { OrderEventsPublisher } from './gateways/order-events.publisher';
import { PaymentGateway } from './gateways/payment.gateway';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let ordersRepository: jest.Mocked<
    Pick<Repository<Order>, 'create' | 'find' | 'findOne' | 'save'>
  >;
  let inventoryGateway: jest.Mocked<InventoryGateway>;
  let paymentGateway: jest.Mocked<PaymentGateway>;
  let orderEventsPublisher: jest.Mocked<Pick<OrderEventsPublisher, 'publish'>>;

  const createOrderDto: CreateOrderDto = {
    items: [
      {
        productId: 'product-1',
        quantity: 2,
        unitPrice: 25,
      },
    ],
    userId: 'user-1',
  };

  const createdAt = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    ordersRepository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    inventoryGateway = {
      checkStock: jest.fn(),
      decreaseStock: jest.fn(),
    };

    paymentGateway = {
      processPayment: jest.fn(),
      refundPayment: jest.fn(),
    };

    orderEventsPublisher = {
      publish: jest.fn(),
    };

    ordersRepository.create.mockImplementation((order) => order as Order);
    ordersRepository.save.mockImplementation((order) =>
      Promise.resolve({
        ...(order as Order),
        createdAt,
        id: order.id ?? 'order-1',
        updatedAt: createdAt,
      }),
    );
    inventoryGateway.checkStock.mockResolvedValue(undefined);
    inventoryGateway.decreaseStock.mockResolvedValue(undefined);
    paymentGateway.processPayment.mockResolvedValue(undefined);
    paymentGateway.refundPayment.mockResolvedValue(undefined);
    orderEventsPublisher.publish.mockResolvedValue(undefined);

    service = new OrdersService(
      ordersRepository as unknown as Repository<Order>,
      inventoryGateway,
      paymentGateway,
      orderEventsPublisher as unknown as OrderEventsPublisher,
    );
  });

  it('completes an order when stock and payment steps succeed', async () => {
    const result = await service.create(createOrderDto);

    expect(result.status).toBe(OrderStatus.Completed);
    expect(result.totalAmount).toBe('50.00');
    expect(inventoryGateway.checkStock.mock.calls).toEqual([
      [createOrderDto.items],
    ]);
    expect(paymentGateway.processPayment.mock.calls).toEqual([['order-1', 50]]);
    expect(inventoryGateway.decreaseStock.mock.calls).toEqual([
      [createOrderDto.items],
    ]);
    expect(paymentGateway.refundPayment.mock.calls).toHaveLength(0);
    expect(orderEventsPublisher.publish.mock.calls[0]).toEqual([
      'order.created',
      expect.objectContaining({ id: 'order-1' }),
    ]);
    expect(orderEventsPublisher.publish.mock.calls[1]).toEqual([
      'order.completed',
      expect.objectContaining({ status: OrderStatus.Completed }),
    ]);
  });

  it('fails an order when stock check fails', async () => {
    inventoryGateway.checkStock.mockRejectedValueOnce(
      new Error('Stock is not available'),
    );

    const result = await service.create(createOrderDto);

    expect(result.status).toBe(OrderStatus.Failed);
    expect(result.failureReason).toBe('Stock is not available');
    expect(paymentGateway.processPayment.mock.calls).toHaveLength(0);
    expect(paymentGateway.refundPayment.mock.calls).toHaveLength(0);
    expect(
      orderEventsPublisher.publish.mock.calls[
        orderEventsPublisher.publish.mock.calls.length - 1
      ],
    ).toEqual([
      'order.failed',
      expect.objectContaining({ status: OrderStatus.Failed }),
    ]);
  });

  it('fails an order when payment processing fails', async () => {
    paymentGateway.processPayment.mockRejectedValueOnce(
      new Error('Payment failed'),
    );

    const result = await service.create(createOrderDto);

    expect(result.status).toBe(OrderStatus.Failed);
    expect(result.failureReason).toBe('Payment failed');
    expect(inventoryGateway.decreaseStock.mock.calls).toHaveLength(0);
    expect(paymentGateway.refundPayment.mock.calls).toHaveLength(0);
  });

  it('refunds payment when stock decrease fails after payment succeeds', async () => {
    inventoryGateway.decreaseStock.mockRejectedValueOnce(
      new Error('Stock decrease failed'),
    );

    const result = await service.create(createOrderDto);

    expect(result.status).toBe(OrderStatus.Failed);
    expect(result.failureReason).toBe('Stock decrease failed');
    expect(paymentGateway.refundPayment.mock.calls).toEqual([['order-1', 50]]);
    expect(
      orderEventsPublisher.publish.mock.calls[
        orderEventsPublisher.publish.mock.calls.length - 1
      ],
    ).toEqual([
      'order.failed',
      expect.objectContaining({ failureReason: 'Stock decrease failed' }),
    ]);
  });

  it('lists orders by latest creation date', async () => {
    const order = { id: 'order-1' } as Order;

    ordersRepository.find.mockResolvedValue([order]);

    await expect(service.findAll()).resolves.toEqual([order]);
    expect(ordersRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('finds an order by id', async () => {
    const order = { id: 'order-1' } as Order;

    ordersRepository.findOne.mockResolvedValue(order);

    await expect(service.findOne(order.id)).resolves.toBe(order);
    expect(ordersRepository.findOne).toHaveBeenCalledWith({
      where: { id: order.id },
    });
  });

  it('throws when an order does not exist', async () => {
    ordersRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-order')).rejects.toThrow(
      NotFoundException,
    );
  });
});
