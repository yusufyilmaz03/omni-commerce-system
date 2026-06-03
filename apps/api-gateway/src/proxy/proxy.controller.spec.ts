import { ProxyController } from './proxy.controller';
import { ServiceProxyService } from './service-proxy.service';

describe('ProxyController', () => {
  let controller: ProxyController;
  let serviceProxyService: jest.Mocked<Pick<ServiceProxyService, 'forward'>>;

  beforeEach(() => {
    serviceProxyService = {
      forward: jest.fn(),
    };

    controller = new ProxyController(
      serviceProxyService as unknown as ServiceProxyService,
    );
  });

  it('proxies product creation', async () => {
    serviceProxyService.forward.mockResolvedValue({ id: 'product-1' });

    await expect(
      controller.createProduct({ name: 'Keyboard' }),
    ).resolves.toEqual({ id: 'product-1' });
    expect(serviceProxyService.forward).toHaveBeenCalledWith(
      'products',
      'POST',
      '/products',
      { name: 'Keyboard' },
    );
  });

  it('proxies order creation', async () => {
    serviceProxyService.forward.mockResolvedValue({ id: 'order-1' });

    await expect(controller.createOrder({ userId: 'user-1' })).resolves.toEqual(
      {
        id: 'order-1',
      },
    );
    expect(serviceProxyService.forward).toHaveBeenCalledWith(
      'orders',
      'POST',
      '/orders',
      { userId: 'user-1' },
    );
  });

  it('proxies payment circuit breaker snapshot reads', async () => {
    serviceProxyService.forward.mockResolvedValue({ state: 'CLOSED' });

    await expect(controller.getPaymentCircuitBreaker()).resolves.toEqual({
      state: 'CLOSED',
    });
    expect(serviceProxyService.forward).toHaveBeenCalledWith(
      'payments',
      'GET',
      '/payments/circuit-breaker',
    );
  });
});
