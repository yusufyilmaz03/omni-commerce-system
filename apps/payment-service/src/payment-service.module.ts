import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentServiceController } from './payment-service.controller';
import { PaymentServiceService } from './payment-service.service';
import { PaymentsModule } from './payments/payments.module';

import { getDatabaseConfig } from '../../../libs/common/src';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: 'apps/payment-service/.env',
    }),
    TypeOrmModule.forRoot(getDatabaseConfig('PAYMENT')),
    PaymentsModule,
  ],
  controllers: [PaymentServiceController],
  providers: [PaymentServiceService],
})
export class PaymentServiceModule {}
