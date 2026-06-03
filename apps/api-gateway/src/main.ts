import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { JsonLogger } from '../../../libs/common/src/observability/json-logger.service';
import { startOpenTelemetry } from '../../../libs/common/src/observability/tracing';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  startOpenTelemetry('api-gateway');
  const app = await NestFactory.create(ApiGatewayModule, {
    logger: new JsonLogger('api-gateway'),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
