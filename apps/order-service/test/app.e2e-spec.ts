import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { Server } from 'http';
import * as request from 'supertest';
import { OrderServiceModule } from './../src/order-service.module';

describe('OrderServiceController (e2e)', () => {
  let app: INestApplication;
  let httpServer: Server;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [OrderServiceModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer() as Server;
  });

  it('/ (GET)', () => {
    return request(httpServer).get('/').expect(200).expect('Hello World!');
  });
});
