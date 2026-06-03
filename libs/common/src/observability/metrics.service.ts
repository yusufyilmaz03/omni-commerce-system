import { Inject, Injectable } from '@nestjs/common';
import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from 'prom-client';
import { SERVICE_NAME } from './observability.constants';

export type HttpMetricLabels = {
  method: string;
  route: string;
  statusCode: string;
};

@Injectable()
export class MetricsService {
  private readonly registry = new Registry();
  private readonly httpRequestCounter: Counter<string>;
  private readonly httpRequestDuration: Histogram<string>;

  constructor(@Inject(SERVICE_NAME) private readonly serviceName: string) {
    this.registry.setDefaultLabels({
      service: this.serviceName,
    });

    collectDefaultMetrics({
      prefix: 'omni_',
      register: this.registry,
    });

    this.httpRequestCounter = new Counter({
      help: 'Total HTTP requests processed by the service',
      labelNames: ['method', 'route', 'status_code'],
      name: 'omni_http_requests_total',
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status_code'],
      name: 'omni_http_request_duration_seconds',
      registers: [this.registry],
    });
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  async renderMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  recordHttpRequest(labels: HttpMetricLabels, durationMs: number): void {
    const normalizedLabels = {
      method: labels.method,
      route: labels.route,
      status_code: labels.statusCode,
    };

    this.httpRequestCounter.inc(normalizedLabels);
    this.httpRequestDuration.observe(normalizedLabels, durationMs / 1000);
  }
}
