import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: jest.Mocked<Pick<JwtService, 'signAsync' | 'verifyAsync'>>;

  beforeEach(() => {
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    jwtService.signAsync.mockResolvedValue('signed-token');

    service = new AuthService(jwtService as unknown as JwtService);
  });

  it('registers a user and returns a signed access token', async () => {
    const result = await service.register({
      email: 'User@Example.com',
      name: 'Test User',
      password: 'password123',
    });

    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        email: 'user@example.com',
        id: expect.any(String) as string,
        name: 'Test User',
      },
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      email: 'user@example.com',
      name: 'Test User',
      sub: result.user.id,
    });
  });

  it('rejects duplicate registrations', async () => {
    const dto = {
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
    };

    await service.register(dto);

    await expect(service.register(dto)).rejects.toThrow(ConflictException);
  });

  it('logs in a registered user', async () => {
    await service.register({
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
    });

    const result = await service.login({
      email: 'user@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('user@example.com');
  });

  it('rejects invalid credentials', async () => {
    await service.register({
      email: 'user@example.com',
      name: 'Test User',
      password: 'password123',
    });

    await expect(
      service.login({
        email: 'user@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('verifies a JWT payload', async () => {
    jwtService.verifyAsync.mockResolvedValue({
      email: 'user@example.com',
      name: 'Test User',
      sub: 'user-1',
    });

    await expect(service.verifyToken('token')).resolves.toEqual({
      email: 'user@example.com',
      id: 'user-1',
      name: 'Test User',
    });
  });
});
