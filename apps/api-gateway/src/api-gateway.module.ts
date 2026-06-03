import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ObservabilityModule } from '../../../libs/common/src/observability/observability.module';
import { ApiGatewayController } from './api-gateway.controller';
import { AuthModule } from './auth/auth.module';
import { UserThrottlerGuard } from './auth/guards/user-throttler.guard';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ProxyModule } from './proxy/proxy.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/api-gateway/.env',
    }),
    ThrottlerModule.forRoot([
      {
        limit: 100,
        ttl: 60_000,
      },
    ]),
    ObservabilityModule.forService('api-gateway'),
    AuthModule,
    ProxyModule,
  ],
  controllers: [ApiGatewayController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: UserThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class ApiGatewayModule {}
