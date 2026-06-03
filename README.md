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
```

For local clusters without `LoadBalancer` support:

```bash
kubectl -n omni-commerce port-forward svc/api-gateway 3000:3000
```

## Notes

- Current API Gateway user storage is in-memory for the development phase.
- TypeORM `synchronize: true` is enabled for local development.
- KafkaJS may print a partitioner migration warning; it is not a startup failure.
- Observability stack integration is the next roadmap step.
