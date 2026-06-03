# Omni-Commerce System

NestJS microservice graduation project for a scalable, resilient, event-driven e-commerce backend.

## Architecture

- `api-gateway`: external entry point, JWT auth, bcrypt password hashing, rate limiting, global exception filter, logging interceptor, service proxy routes
- `product-service`: product CRUD, validation, PostgreSQL, Redis product list cache, stock Kafka events
- `order-service`: order creation, Saga orchestration, compensation handling, order Kafka events
- `payment-service`: mock payment processor, Circuit Breaker, payment Kafka events
- `libs/common`: shared database, Kafka, and event contract helpers

Infrastructure:

- PostgreSQL database per service
- Kafka for event-driven service communication
- Redis for product list caching
- Docker Compose for local development
- Kubernetes manifests for deployment/service discovery
- Postman collection for API Gateway flow testing
- JSON logs, Prometheus metrics, Grafana dashboards, and OpenTelemetry traces

## Prerequisites

- Node.js 22+
- npm
- Docker and Docker Compose
- Optional: Kubernetes cluster such as Docker Desktop Kubernetes, Minikube, or Kind

## Install

```bash
npm install
```

## Local Infrastructure

Start PostgreSQL, Kafka, Redis, and create Kafka topics:

```bash
docker compose up -d kafka redis product-db order-db payment-db
docker compose up kafka-init
```

Kafka topics created by `kafka-init`:

- `order.created`
- `order.completed`
- `order.failed`
- `payment.succeeded`
- `payment.failed`
- `stock.decreased`
- `stock.failed`

## Run Services Locally

Use separate terminals:

```bash
npx nest start product-service
npx nest start order-service
npx nest start payment-service
npx nest start api-gateway
```

Default ports:

- API Gateway: `http://localhost:3000`
- Product Service: `http://localhost:3001`
- Order Service: `http://localhost:3002`
- Payment Service: `http://localhost:3003`

## Docker Compose Apps

Build and run the full local stack:

```bash
docker compose up --build
```

The app services override local `.env` hostnames with Compose service DNS names.

Observability UIs:

- Prometheus: `http://localhost:9090`
- Grafana: `http://localhost:3004` (`admin` / `admin`)
- Tempo API: `http://localhost:3200`

Each NestJS service exposes Prometheus metrics at `/metrics`.

## Observability

The shared observability module in `libs/common` provides:

- ELK-compatible JSON application logs
- Prometheus default Node.js metrics
- HTTP request counter and duration histogram
- `/metrics` endpoint on each service
- OpenTelemetry auto-instrumentation when `OTEL_ENABLED=true`
- OTLP trace export through OpenTelemetry Collector to Tempo

Local Compose observability files:

```txt
observability/prometheus/prometheus.yml
observability/otel-collector/config.yaml
observability/tempo/tempo.yaml
observability/grafana/provisioning/
observability/grafana/dashboards/
```

## API Flow

Import:

```txt
postman/omni-commerce-system.postman_collection.json
```

Recommended request order:

1. `Health`
2. `Auth - Register`
3. `Products - Create`
4. `Products - List`
5. `Orders - Create`
6. `Orders - Find By ID`
7. `Payments - Process`
8. `Payments - Circuit Breaker`

Protected routes require:

```txt
Authorization: Bearer {{accessToken}}
```

## Tests and Validation

```bash
npm test -- --runInBand
npx eslint "{apps,libs}/**/*.ts"
npx nest build api-gateway
npx nest build product-service
npx nest build order-service
npx nest build payment-service
npx tsc -p apps/api-gateway/tsconfig.app.json --noEmit
npx tsc -p apps/product-service/tsconfig.app.json --noEmit
npx tsc -p apps/order-service/tsconfig.app.json --noEmit
npx tsc -p apps/payment-service/tsconfig.app.json --noEmit
```

## Kubernetes

Build images with names used by the manifests:

```bash
docker build -t omni-commerce/api-gateway:latest -f apps/api-gateway/Dockerfile .
docker build -t omni-commerce/product-service:latest -f apps/product-service/Dockerfile .
docker build -t omni-commerce/order-service:latest -f apps/order-service/Dockerfile .
docker build -t omni-commerce/payment-service:latest -f apps/payment-service/Dockerfile .
```

Apply manifests:

```bash
kubectl apply -f k8s/00-namespace-config.yaml
kubectl apply -f k8s/10-infrastructure.yaml
kubectl apply -f k8s/20-applications.yaml
kubectl apply -f k8s/30-observability.yaml
```

For local clusters without `LoadBalancer` support:

```bash
kubectl -n omni-commerce port-forward svc/api-gateway 3000:3000
kubectl -n omni-commerce port-forward svc/grafana 3004:3000
kubectl -n omni-commerce port-forward svc/prometheus 9090:9090
```

## Production Readiness Notes

- API Gateway authentication is suitable for demo/development only and is not production-ready because user storage is in-memory.
- Use persistent user storage, token revocation/rotation, secret management, and stricter CORS/security headers before production use.
- TypeORM `synchronize: true` is enabled for local development.
- KafkaJS may print a partitioner migration warning; it is not a startup failure.
- OpenTelemetry is disabled for local `nest start` unless `OTEL_ENABLED=true` is set.
