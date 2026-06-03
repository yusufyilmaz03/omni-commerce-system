import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './order.entity';
import { OrderStatus } from './order-status.enum';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<
    Pick<OrdersService, 'create' | 'findAll' | 'findOne'>
  >;

  const order: Order = {
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    id: 'order-1',
    items: [{ productId: 'product-1', quantity: 2, unitPrice: 25 }],
    status: OrderStatus.Completed,
    totalAmount: '50.00',
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userId: 'user-1',
  };

  beforeEach(() => {
    ordersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new OrdersController(
      ordersService as unknown as OrdersService,
    );
  });

  it('delegates order creation to the service', async () => {
    const dto: CreateOrderDto = {
      items: order.items,
      userId: order.userId,
    };

    ordersService.create.mockResolvedValue(order);

    await expect(controller.create(dto)).resolves.toBe(order);
    expect(ordersService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates order listing to the service', async () => {
    ordersService.findAll.mockResolvedValue([order]);

    await expect(controller.findAll()).resolves.toEqual([order]);
    expect(ordersService.findAll).toHaveBeenCalledTimes(1);
  });

  it('delegates finding one order to the service', async () => {
    ordersService.findOne.mockResolvedValue(order);

    await expect(controller.findOne(order.id)).resolves.toBe(order);
    expect(ordersService.findOne).toHaveBeenCalledWith(order.id);
  });
});
