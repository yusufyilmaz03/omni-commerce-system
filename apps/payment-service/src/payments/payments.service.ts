import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CircuitBreakerService } from './circuit-breaker.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { MockPaymentProcessorService } from './mock-payment-processor.service';
import { PaymentEventsPublisher } from './payment-events.publisher';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    private readonly mockPaymentProcessor: MockPaymentProcessorService,
    private readonly circuitBreaker: CircuitBreakerService,
    private readonly paymentEventsPublisher: PaymentEventsPublisher,
  ) {}

  async processPayment(processPaymentDto: ProcessPaymentDto): Promise<Payment> {
    const payment = await this.createPayment(processPaymentDto);

    try {
      await this.circuitBreaker.execute(() =>
        this.mockPaymentProcessor.process(
          processPaymentDto.amount,
          processPaymentDto.shouldFail,
        ),
      );

      payment.status = PaymentStatus.Succeeded;
      payment.failureReason = undefined;

      const savedPayment = await this.paymentsRepository.save(payment);
      await this.paymentEventsPublisher.publishPaymentSucceeded(
        this.toPaymentEventPayload(savedPayment),
      );

      return savedPayment;
    } catch (error) {
      payment.status = PaymentStatus.Failed;
      payment.failureReason =
        error instanceof Error ? error.message : 'Unknown payment failure';

      const savedPayment = await this.paymentsRepository.save(payment);
      await this.paymentEventsPublisher.publishPaymentFailed(
        this.toPaymentEventPayload(savedPayment),
      );

      return savedPayment;
    }
  }

  async refundPayment(refundPaymentDto: RefundPaymentDto): Promise<Payment> {
    const payment = await this.findLatestPaymentByOrderId(
      refundPaymentDto.orderId,
    );

    await this.mockPaymentProcessor.refund(refundPaymentDto.amount);

    payment.status = PaymentStatus.Refunded;
    payment.failureReason = undefined;

    return this.paymentsRepository.save(payment);
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({ where: { id } });

    if (!payment) {
      throw new NotFoundException(`Payment with id ${id} not found`);
    }

    return payment;
  }

  private async createPayment(
    processPaymentDto: ProcessPaymentDto,
  ): Promise<Payment> {
    const payment = this.paymentsRepository.create({
      amount: processPaymentDto.amount.toFixed(2),
      orderId: processPaymentDto.orderId,
      status: PaymentStatus.Pending,
      userId: processPaymentDto.userId,
    });

    return this.paymentsRepository.save(payment);
  }

  private async findLatestPaymentByOrderId(orderId: string): Promise<Payment> {
    const payment = await this.paymentsRepository.findOne({
      order: { createdAt: 'DESC' },
      where: { orderId },
    });

    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }

    return payment;
  }

  private toPaymentEventPayload(payment: Payment) {
    return {
      amount: payment.amount,
      failureReason: payment.failureReason,
      orderId: payment.orderId,
      paymentId: payment.id,
      status: payment.status,
      userId: payment.userId,
    };
  }
}
