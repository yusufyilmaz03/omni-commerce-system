import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JsonValue } from './proxy.types';
import { ServiceProxyService } from './service-proxy.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class ProxyController {
  constructor(private readonly serviceProxyService: ServiceProxyService) {}

  @Post('products')
  createProduct(@Body() body: JsonValue): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'products',
      'POST',
      '/products',
      body,
    );
  }

  @Get('products')
  listProducts(): Promise<JsonValue> {
    return this.serviceProxyService.forward('products', 'GET', '/products');
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'products',
      'GET',
      `/products/${id}`,
    );
  }

  @Patch('products/:id/stock')
  updateProductStock(
    @Param('id') id: string,
    @Body() body: JsonValue,
  ): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'products',
      'PATCH',
      `/products/${id}/stock`,
      body,
    );
  }

  @Post('orders')
  createOrder(@Body() body: JsonValue): Promise<JsonValue> {
    return this.serviceProxyService.forward('orders', 'POST', '/orders', body);
  }

  @Get('orders')
  listOrders(): Promise<JsonValue> {
    return this.serviceProxyService.forward('orders', 'GET', '/orders');
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string): Promise<JsonValue> {
    return this.serviceProxyService.forward('orders', 'GET', `/orders/${id}`);
  }

  @Post('payments/process')
  processPayment(@Body() body: JsonValue): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'payments',
      'POST',
      '/payments/process',
      body,
    );
  }

  @Post('payments/refund')
  refundPayment(@Body() body: JsonValue): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'payments',
      'POST',
      '/payments/refund',
      body,
    );
  }

  @Get('payments')
  listPayments(): Promise<JsonValue> {
    return this.serviceProxyService.forward('payments', 'GET', '/payments');
  }

  @Get('payments/circuit-breaker')
  getPaymentCircuitBreaker(): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'payments',
      'GET',
      '/payments/circuit-breaker',
    );
  }

  @Get('payments/:id')
  getPayment(@Param('id') id: string): Promise<JsonValue> {
    return this.serviceProxyService.forward(
      'payments',
      'GET',
      `/payments/${id}`,
    );
  }
}
