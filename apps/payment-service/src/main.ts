import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '../../../libs/common/src/config/kafka.config';
import { JsonLogger } from '../../../libs/common/src/observability/json-logger.service';
import { startOpenTelemetry } from '../../../libs/common/src/observability/tracing';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  startOpenTelemetry('payment-service');
  const app = await NestFactory.create(PaymentServiceModule, {
    logger: new JsonLogger('payment-service'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.connectMicroservice(
    getKafkaConfig('payment-service', 'payment-service-group'),
  );
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3003);
}
void bootstrap();
