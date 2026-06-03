import { MetricsService } from './metrics.service';

describe('MetricsService', () => {
  it('renders default and HTTP metrics with service labels', async () => {
    const metricsService = new MetricsService('test-service');

    metricsService.recordHttpRequest(
      {
        method: 'GET',
        route: '/health',
        statusCode: '200',
      },
      25,
    );

    const metrics = await metricsService.renderMetrics();

    expect(metrics).toContain('omni_http_requests_total');
    expect(metrics).toContain('service="test-service"');
    expect(metrics).toContain('method="GET"');
    expect(metrics).toContain('route="/health"');
    expect(metrics).toContain('status_code="200"');
  });
});
