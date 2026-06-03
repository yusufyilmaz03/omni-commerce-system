import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '../../../libs/common/src/config/kafka.config';
import { JsonLogger } from '../../../libs/common/src/observability/json-logger.service';
import { startOpenTelemetry } from '../../../libs/common/src/observability/tracing';
import { ProductServiceModule } from './product-service.module';

async function bootstrap() {
  startOpenTelemetry('product-service');
  const app = await NestFactory.create(ProductServiceModule, {
    logger: new JsonLogger('product-service'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.connectMicroservice(
    getKafkaConfig('product-service', 'product-service-group'),
  );
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
