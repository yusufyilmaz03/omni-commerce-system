import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '../../../libs/common/src';
import { PaymentServiceModule } from './payment-service.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentServiceModule);
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
