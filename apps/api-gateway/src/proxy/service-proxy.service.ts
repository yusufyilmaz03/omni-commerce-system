import { BadGatewayException, Injectable } from '@nestjs/common';

import { HttpMethod, JsonValue, ServiceName } from './proxy.types';

@Injectable()
export class ServiceProxyService {
  private readonly serviceUrls: Record<ServiceName, string> = {
    orders: process.env.ORDER_SERVICE_URL ?? 'http://localhost:3002',
    payments: process.env.PAYMENT_SERVICE_URL ?? 'http://localhost:3003',
    products: process.env.PRODUCT_SERVICE_URL ?? 'http://localhost:3001',
  };

  async forward(
    serviceName: ServiceName,
    method: HttpMethod,
    path: string,
    body?: JsonValue,
  ): Promise<JsonValue> {
    const url = `${this.serviceUrls[serviceName]}${path}`;

    try {
      const response = await fetch(url, {
        body: body === undefined ? undefined : JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
        },
        method,
      });
      const responseBody = await this.parseResponse(response);

      if (!response.ok) {
        throw new BadGatewayException({
          message: responseBody,
          service: serviceName,
          statusCode: response.status,
        });
      }

      return responseBody;
    } catch (error) {
      if (error instanceof BadGatewayException) {
        throw error;
      }

      throw new BadGatewayException(`${serviceName} service request failed`);
    }
  }

  private async parseResponse(response: Response): Promise<JsonValue> {
    const text = await response.text();

    if (!text) {
      return null;
    }

    return JSON.parse(text) as JsonValue;
  }
}
