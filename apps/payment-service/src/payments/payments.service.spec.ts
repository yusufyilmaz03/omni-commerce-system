import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { CircuitBreakerService } from './circuit-breaker.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { MockPaymentProcessorService } from './mock-payment-processor.service';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepository: jest.Mocked<
    Pick<Repository<Payment>, 'create' | 'find' | 'findOne' | 'save'>
  >;
  let mockPaymentProcessor: jest.Mocked<MockPaymentProcessorService>;
  let circuitBreaker: jest.Mocked<Pick<CircuitBreakerService, 'execute'>>;

  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const processPaymentDto: ProcessPaymentDto = {
    amount: 50,
    orderId: 'order-1',
    shouldFail: false,
    userId: 'user-1',
  };

  beforeEach(() => {
    paymentsRepository = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };

    mockPaymentProcessor = {
      process: jest.fn(),
      refund: jest.fn(),
    };

    circuitBreaker = {
      execute: jest.fn(),
    };

    paymentsRepository.create.mockImplementation(
      (payment) => payment as Payment,
    );
    paymentsRepository.save.mockImplementation((payment) =>
      Promise.resolve({
        ...(payment as Payment),
        createdAt,
        id: payment.id ?? 'payment-1',
        updatedAt: createdAt,
      }),
    );
    mockPaymentProcessor.process.mockResolvedValue(undefined);
    mockPaymentProcessor.refund.mockResolvedValue(undefined);
    circuitBreaker.execute.mockImplementation((operation) => operation());

    service = new PaymentsService(
      paymentsRepository as unknown as Repository<Payment>,
      mockPaymentProcessor,
      circuitBreaker as unknown as CircuitBreakerService,
    );
  });

  it('stores a succeeded payment when processor succeeds', async () => {
    const result = await service.processPayment(processPaymentDto);

    expect(result.status).toBe(PaymentStatus.Succeeded);
    expect(result.amount).toBe('50.00');
    expect(mockPaymentProcessor.process.mock.calls).toEqual([[50, false]]);
    expect(circuitBreaker.execute.mock.calls).toHaveLength(1);
  });

  it('stores a failed payment when processor fails', async () => {
    mockPaymentProcessor.process.mockRejectedValueOnce(
      new Error('Mock payment processor failed'),
    );

    const result = await service.processPayment({
      ...processPaymentDto,
      shouldFail: true,
    });

    expect(result.status).toBe(PaymentStatus.Failed);
    expect(result.failureReason).toBe('Mock payment processor failed');
    expect(mockPaymentProcessor.process.mock.calls).toEqual([[50, true]]);
  });

  it('stores a failed payment when circuit breaker rejects execution', async () => {
    circuitBreaker.execute.mockRejectedValueOnce(new Error('Circuit is open'));

    const result = await service.processPayment(processPaymentDto);

    expect(result.status).toBe(PaymentStatus.Failed);
    expect(result.failureReason).toBe('Circuit is open');
    expect(mockPaymentProcessor.process.mock.calls).toHaveLength(0);
  });

  it('refunds the latest payment for an order', async () => {
    const payment = {
      ...paymentRecord(),
      status: PaymentStatus.Succeeded,
    };

    paymentsRepository.findOne.mockResolvedValue(payment);

    const dto: RefundPaymentDto = {
      amount: 50,
      orderId: payment.orderId,
    };

    const result = await service.refundPayment(dto);

    expect(mockPaymentProcessor.refund.mock.calls).toEqual([[50]]);
    expect(result.status).toBe(PaymentStatus.Refunded);
    expect(paymentsRepository.findOne).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
      where: { orderId: payment.orderId },
    });
  });

  it('throws when refund payment target does not exist', async () => {
    paymentsRepository.findOne.mockResolvedValue(null);

    await expect(
      service.refundPayment({ amount: 50, orderId: 'missing-order' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('lists payments by latest creation date', async () => {
    const payment = paymentRecord();

    paymentsRepository.find.mockResolvedValue([payment]);

    await expect(service.findAll()).resolves.toEqual([payment]);
    expect(paymentsRepository.find).toHaveBeenCalledWith({
      order: { createdAt: 'DESC' },
    });
  });

  it('finds a payment by id', async () => {
    const payment = paymentRecord();

    paymentsRepository.findOne.mockResolvedValue(payment);

    await expect(service.findOne(payment.id)).resolves.toBe(payment);
    expect(paymentsRepository.findOne).toHaveBeenCalledWith({
      where: { id: payment.id },
    });
  });

  it('throws when a payment does not exist', async () => {
    paymentsRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing-payment')).rejects.toThrow(
      NotFoundException,
    );
  });

  function paymentRecord(): Payment {
    return {
      amount: '50.00',
      createdAt,
      id: 'payment-1',
      orderId: 'order-1',
      status: PaymentStatus.Pending,
      updatedAt: createdAt,
      userId: 'user-1',
    };
  }
});
