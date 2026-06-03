import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getKafkaConfig } from '../../../libs/common/src';
import { ProductServiceModule } from './product-service.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductServiceModule);
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
