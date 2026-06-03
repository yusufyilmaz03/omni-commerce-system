import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AuthService } from '../auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let authService: jest.Mocked<Pick<AuthService, 'verifyToken'>>;

  beforeEach(() => {
    authService = {
      verifyToken: jest.fn(),
    };

    guard = new JwtAuthGuard(authService as unknown as AuthService);
  });

  it('attaches the verified user to the request', async () => {
    const request = {
      headers: {
        authorization: 'Bearer access-token',
      },
    };

    authService.verifyToken.mockResolvedValue({
      email: 'user@example.com',
      id: 'user-1',
      name: 'Test User',
    });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toEqual({
      headers: {
        authorization: 'Bearer access-token',
      },
      user: {
        email: 'user@example.com',
        id: 'user-1',
        name: 'Test User',
      },
    });
  });

  it('rejects requests without bearer tokens', async () => {
    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toThrow(UnauthorizedException);
  });

  function createContext(request: object): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  }
});
