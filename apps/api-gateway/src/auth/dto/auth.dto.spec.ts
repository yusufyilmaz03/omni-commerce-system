import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';

describe('Auth DTO validation', () => {
  it('accepts a valid register payload', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects invalid register payload values', async () => {
    const dto = plainToInstance(RegisterDto, {
      email: 'not-email',
      name: '',
      password: 'short',
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(3);
  });

  it('accepts a valid login payload', async () => {
    const dto = plainToInstance(LoginDto, {
      email: 'user@example.com',
      password: 'password123',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
