import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';
import { PaymentsModule } from './payments/payments.module';

import { getDatabaseConfig } from '../../../libs/common/src/config/database.config';
import { ObservabilityModule } from '../../../libs/common/src/observability/observability.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/payment-service/.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig('PAYMENT')),
    ObservabilityModule.forService('payment-service'),
    PaymentsModule,
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentServiceService],
})
export class PaymentServiceModule {}
