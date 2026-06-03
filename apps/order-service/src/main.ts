import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '../../../libs/common/src';
import { OrderServiceModule } from './order-service.module';

async function bootstrap() {
  const app = await NestFactory.create(OrderServiceModule);
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
