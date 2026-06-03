import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateOrderDto } from './dto/create-order.dto';
import { InventoryGateway } from './gateways/inventory.gateway';
import { OrderEventsPublisher } from './gateways/order-events.publisher';
import { PaymentGateway } from './gateways/payment.gateway';
import { Order, OrderItem } from './order.entity';
import { OrderStatus } from './order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>,
    private readonly inventoryGateway: InventoryGateway,
    private readonly paymentGateway: PaymentGateway,
    private readonly orderEventsPublisher: OrderEventsPublisher,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const items = this.toOrderItems(createOrderDto);
    const totalAmount = this.calculateTotalAmount(items);
    const order = await this.saveOrder({
      items,
      status: OrderStatus.Created,
      totalAmount: totalAmount.toFixed(2),
      userId: createOrderDto.userId,
    });

    await this.orderEventsPublisher.publish('order.created', order);

    return this.runSaga(order, totalAmount);
  }

  async findAll(): Promise<Order[]> {
    return this.ordersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.ordersRepository.findOne({ where: { id } });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }

  private async runSaga(order: Order, totalAmount: number): Promise<Order> {
    let paymentProcessed = false;

    try {
      await this.inventoryGateway.checkStock(order.items);
      await this.paymentGateway.processPayment(order.id, totalAmount);
      paymentProcessed = true;
      await this.inventoryGateway.decreaseStock(order.items);

      order.status = OrderStatus.Completed;
      order.failureReason = undefined;

      const completedOrder = await this.ordersRepository.save(order);
      await this.orderEventsPublisher.publish(
        'order.completed',
        completedOrder,
      );

      return completedOrder;
    } catch (error) {
      const failureReason =
        error instanceof Error ? error.message : 'Unknown order failure';

      if (paymentProcessed) {
        await this.paymentGateway.refundPayment(order.id, totalAmount);
      }

      order.status = OrderStatus.Failed;
      order.failureReason = failureReason;

      const failedOrder = await this.ordersRepository.save(order);
      await this.orderEventsPublisher.publish('order.failed', failedOrder);

      return failedOrder;
    }
  }

  private toOrderItems(createOrderDto: CreateOrderDto): OrderItem[] {
    return createOrderDto.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));
  }

  private calculateTotalAmount(items: OrderItem[]): number {
    return items.reduce(
      (total, item) => total + item.quantity * item.unitPrice,
      0,
    );
  }

  private async saveOrder(order: Partial<Order>): Promise<Order> {
    return this.ordersRepository.save(this.ordersRepository.create(order));
  }
}
