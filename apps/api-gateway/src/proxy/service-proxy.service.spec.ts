import { BadGatewayException } from '@nestjs/common';

import { ServiceProxyService } from './service-proxy.service';

describe('ServiceProxyService', () => {
  let service: ServiceProxyService;
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock;
    process.env.PRODUCT_SERVICE_URL = 'http://product-service';
    service = new ServiceProxyService();
  });

  it('forwards requests to the configured service URL', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ id: 'product-1' }]), {
        status: 200,
      }),
    );

    const result = await service.forward('products', 'GET', '/products');

    expect(result).toEqual([{ id: 'product-1' }]);
    expect(fetchMock).toHaveBeenCalledWith('http://product-service/products', {
      body: undefined,
      headers: {
        'content-type': 'application/json',
      },
      method: 'GET',
    });
  });

  it('sends request bodies as JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'product-1' }), {
        status: 201,
      }),
    );

    await service.forward('products', 'POST', '/products', {
      name: 'Keyboard',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://product-service/products', {
      body: JSON.stringify({ name: 'Keyboard' }),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
    });
  });

  it('wraps downstream errors as bad gateway responses', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'downstream error' }), {
        status: 500,
      }),
    );

    await expect(
      service.forward('products', 'GET', '/products'),
    ).rejects.toThrow(BadGatewayException);
  });
});
