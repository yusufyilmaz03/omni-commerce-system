import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { ThrottlerStorage } from '@nestjs/throttler/dist/throttler-storage.interface';

import { JwtPayload } from '../auth.types';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {
    super(options, storageService, reflector);
  }

  protected override async getTracker(
    req: Record<string, any>,
  ): Promise<string> {
    const headers = req.headers as
      | Record<string, string | undefined>
      | undefined;
    const authorization = headers?.authorization;
    const [type, token] = authorization?.split(' ') ?? [];

    if (type === 'Bearer' && token) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);

        return `user:${payload.sub}`;
      } catch {
        return super.getTracker(req);
      }
    }

    return super.getTracker(req);
  }
}
