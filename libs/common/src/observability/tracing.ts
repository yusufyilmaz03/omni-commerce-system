import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

export function startOpenTelemetry(serviceName: string): void {
  if (!isOpenTelemetryEnabled()) {
    return;
  }

  if (sdk) {
    return;
  }

  sdk = new NodeSDK({
    instrumentations: [getNodeAutoInstrumentations()],
    serviceName,
    traceExporter: new OTLPTraceExporter({
      url: getTraceExporterUrl(),
    }),
  });

  sdk.start();
}

export async function shutdownOpenTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  await sdk.shutdown();
  sdk = undefined;
}

function isOpenTelemetryEnabled(): boolean {
  return process.env.OTEL_ENABLED === 'true';
}

function getTraceExporterUrl(): string {
  if (process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT) {
    return process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  }

  const baseEndpoint =
    process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';

  return `${baseEndpoint.replace(/\/$/, '')}/v1/traces`;
}
