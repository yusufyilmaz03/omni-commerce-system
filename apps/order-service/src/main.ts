import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '../../../libs/common/src/config/kafka.config';
import { JsonLogger } from '../../../libs/common/src/observability/json-logger.service';
import { startOpenTelemetry } from '../../../libs/common/src/observability/tracing';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  startOpenTelemetry('order-service');
  const app = await NestFactory.create(OrderServiceModule, {
    logger: new JsonLogger('order-service'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.connectMicroservice(
    getKafkaConfig('order-service', 'order-service-group'),
  );
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3002);
}
void bootstrap();
