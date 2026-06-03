import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateOrderDto } from './create-order.dto';

describe('CreateOrderDto validation', () => {
  it('accepts a valid order payload', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [
        {
          productId: 'product-1',
          quantity: '2',
          unitPrice: '25.50',
        },
      ],
      userId: 'user-1',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.items[0].quantity).toBe(2);
    expect(dto.items[0].unitPrice).toBe(25.5);
  });

  it('rejects empty item lists', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [],
      userId: 'user-1',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });

  it('rejects invalid nested item values', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      items: [
        {
          productId: '',
          quantity: 0,
          unitPrice: -1,
        },
      ],
      userId: 'user-1',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].children?.[0].children).toHaveLength(3);
  });
});
