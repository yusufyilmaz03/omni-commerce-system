import { DynamicModule, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';
import { SERVICE_NAME } from './observability.constants';
import { ObservabilityInterceptor } from './observability.interceptor';

@Module({})
export class ObservabilityModule {
  static forService(serviceName: string): DynamicModule {
    return {
      controllers: [MetricsController],
      exports: [MetricsService],
      module: ObservabilityModule,
      providers: [
        {
          provide: SERVICE_NAME,
          useValue: serviceName,
        },
        MetricsService,
        {
          provide: APP_INTERCEPTOR,
          useClass: ObservabilityInterceptor,
        },
      ],
    };
  }
}
