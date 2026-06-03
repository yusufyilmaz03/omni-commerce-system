import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { ProcessPaymentDto } from './process-payment.dto';
import { RefundPaymentDto } from './refund-payment.dto';

describe('Payment DTO validation', () => {
  it('accepts a valid process payment payload', async () => {
    const dto = plainToInstance(ProcessPaymentDto, {
      amount: '50.25',
      orderId: 'order-1',
      shouldFail: 'false',
      userId: 'user-1',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.amount).toBe(50.25);
    expect(dto.shouldFail).toBe(false);
  });

  it('rejects invalid process payment values', async () => {
    const dto = plainToInstance(ProcessPaymentDto, {
      amount: 0,
      orderId: '',
      userId: '',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(3);
  });

  it('accepts a valid refund payment payload', async () => {
    const dto = plainToInstance(RefundPaymentDto, {
      amount: '50',
      orderId: 'order-1',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.amount).toBe(50);
  });

  it('rejects invalid refund payment values', async () => {
    const dto = plainToInstance(RefundPaymentDto, {
      amount: -1,
      orderId: '',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(2);
  });
});
