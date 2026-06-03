import { CircuitBreakerState } from './circuit-breaker-state.enum';
import { CircuitBreakerService } from './circuit-breaker.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: jest.Mocked<
    Pick<
      PaymentsService,
      'findAll' | 'findOne' | 'processPayment' | 'refundPayment'
    >
  >;
  let circuitBreakerService: jest.Mocked<
    Pick<CircuitBreakerService, 'getSnapshot'>
  >;

  const payment: Payment = {
    amount: '50.00',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    id: 'payment-1',
    orderId: 'order-1',
    status: PaymentStatus.Succeeded,
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    userId: 'user-1',
  };

  beforeEach(() => {
    paymentsService = {
      findAll: jest.fn(),
      findOne: jest.fn(),
      processPayment: jest.fn(),
      refundPayment: jest.fn(),
    };

    circuitBreakerService = {
      getSnapshot: jest.fn(),
    };

    controller = new PaymentsController(
      paymentsService as unknown as PaymentsService,
      circuitBreakerService as unknown as CircuitBreakerService,
    );
  });

  it('delegates payment processing to the service', async () => {
    const dto: ProcessPaymentDto = {
      amount: 50,
      orderId: payment.orderId,
      shouldFail: false,
      userId: payment.userId,
    };

    paymentsService.processPayment.mockResolvedValue(payment);

    await expect(controller.processPayment(dto)).resolves.toBe(payment);
    expect(paymentsService.processPayment).toHaveBeenCalledWith(dto);
  });

  it('delegates payment refunds to the service', async () => {
    const dto: RefundPaymentDto = {
      amount: 50,
      orderId: payment.orderId,
    };

    const refundedPayment = { ...payment, status: PaymentStatus.Refunded };

    paymentsService.refundPayment.mockResolvedValue(refundedPayment);

    await expect(controller.refundPayment(dto)).resolves.toBe(refundedPayment);
    expect(paymentsService.refundPayment).toHaveBeenCalledWith(dto);
  });

  it('delegates payment listing to the service', async () => {
    paymentsService.findAll.mockResolvedValue([payment]);

    await expect(controller.findAll()).resolves.toEqual([payment]);
    expect(paymentsService.findAll).toHaveBeenCalledTimes(1);
  });

  it('delegates finding one payment to the service', async () => {
    paymentsService.findOne.mockResolvedValue(payment);

    await expect(controller.findOne(payment.id)).resolves.toBe(payment);
    expect(paymentsService.findOne).toHaveBeenCalledWith(payment.id);
  });

  it('returns the circuit breaker snapshot', () => {
    const snapshot = {
      failureCount: 0,
      openedAt: null,
      state: CircuitBreakerState.Closed,
    };

    circuitBreakerService.getSnapshot.mockReturnValue(snapshot);

    expect(controller.getCircuitBreaker()).toEqual(snapshot);
  });
});
