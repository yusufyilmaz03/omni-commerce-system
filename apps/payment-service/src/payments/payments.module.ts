import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { getKafkaClientConfig } from '../../../../libs/common/src/config/kafka.config';
import { KAFKA_CLIENT } from '../../../../libs/common/src/events/commerce-events';
import { CircuitBreakerService } from './circuit-breaker.service';
import { MockPaymentProcessorService } from './mock-payment-processor.service';
import { PaymentEventsPublisher } from './payment-events.publisher';
import { Payment } from './payment.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsEventsController } from './payments-events.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    ClientsModule.register([
      getKafkaClientConfig(
        KAFKA_CLIENT,
        'payment-service-producer',
        'payment-service-producer-group',
      ),
    ]),
  ],
  controllers: [PaymentsController, PaymentsEventsController],
  providers: [
    PaymentsService,
    MockPaymentProcessorService,
    CircuitBreakerService,
    PaymentEventsPublisher,
  ],
})
export class PaymentsModule {}
