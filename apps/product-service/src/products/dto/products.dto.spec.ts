import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { CreateProductDto } from './create-product.dto';
import { UpdateStockDto } from './update-stock.dto';

describe('Product DTO validation', () => {
  it('accepts a valid create product payload', async () => {
    const dto = plainToInstance(CreateProductDto, {
      description: 'Mechanical keyboard',
      name: 'Keyboard',
      price: '99.99',
      stock: '10',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.price).toBe(99.99);
    expect(dto.stock).toBe(10);
  });

  it('rejects invalid create product values', async () => {
    const dto = plainToInstance(CreateProductDto, {
      name: '',
      price: -1,
      stock: 1.5,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(3);
  });

  it('accepts a valid stock update payload', async () => {
    const dto = plainToInstance(UpdateStockDto, {
      stock: '3',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.stock).toBe(3);
  });

  it('rejects negative stock updates', async () => {
    const dto = plainToInstance(UpdateStockDto, {
      stock: -1,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
  });
});
