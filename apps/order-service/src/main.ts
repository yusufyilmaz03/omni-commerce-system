import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
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

  await app.listen(process.env.PORT ?? 3002);
}
void bootstrap();
