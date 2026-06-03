import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CircuitBreakerService } from './circuit-breaker.service';
import { MockPaymentProcessorService } from './mock-payment-processor.service';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Payment])],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MockPaymentProcessorService,
    CircuitBreakerService,
  ],
})
export class PaymentsModule {}
