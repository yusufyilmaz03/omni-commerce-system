# Omni-Commerce Kullanım Akışı

Bu dosya, sistemi manuel test ederken hangi endpoint'in hangi sırayla kullanılacağını özetler.

Ana giriş noktası API Gateway'dir:

```txt
http://localhost:3000
```

Product, Order ve Payment servis endpoint'leri API Gateway üzerinden JWT ile korunur. Doğrudan servis portları geliştirme/debug amaçlı kullanılabilir, ancak normal test akışı API Gateway üzerinden yapılmalıdır.

---

## 1. Sistemi Ayağa Kaldır

Tüm servisleri Docker Compose ile başlat:

```bash
docker compose up --build
```

Alternatif olarak altyapıyı Docker ile, servisleri lokal Nest CLI ile başlat:

```bash
docker compose up -d kafka redis product-db order-db payment-db
docker compose up kafka-init

npx nest start product-service
npx nest start order-service
npx nest start payment-service
npx nest start api-gateway
```

Varsayılan portlar:

| Bileşen | URL |
| --- | --- |
| API Gateway | `http://localhost:3000` |
| Product Service | `http://localhost:3001` |
| Order Service | `http://localhost:3002` |
| Payment Service | `http://localhost:3003` |
| Grafana | `http://localhost:3004` |
| Prometheus | `http://localhost:9090` |
| Tempo | `http://localhost:3200` |

---

## 2. Health Check

Önce API Gateway ayakta mı kontrol et:

```http
GET /
```

Beklenen cevap:

```json
{
  "status": "ok"
}
```

---

## 3. Kullanıcı Kaydı ve Login

### 3.1 Register

```http
POST /auth/register
Content-Type: application/json
```

Body:

```json
{
  "email": "demo@example.com",
  "name": "Demo User",
  "password": "Password123"
}
```

Beklenen cevapta `accessToken` gelir. Bu token'ı sonraki isteklerde kullan.

### 3.2 Login

```http
POST /auth/login
Content-Type: application/json
```

Body:

```json
{
  "email": "demo@example.com",
  "password": "Password123"
}
```

Sonraki korumalı isteklerde header:

```txt
Authorization: Bearer <accessToken>
```

Not: API Gateway auth mevcut haliyle demo/development amaçlıdır. User storage in-memory olduğu için production-ready değildir.

---

## 4. Ürün Akışı

Ürün işlemleri Product Service'e API Gateway proxy'si üzerinden gider.

### 4.1 Ürün Oluştur

```http
POST /products
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Body:

```json
{
  "name": "Mechanical Keyboard",
  "description": "RGB keyboard",
  "price": 2499.99,
  "stock": 10
}
```

Cevaptaki `id` değerini `productId` olarak sakla.

### 4.2 Ürünleri Listele

```http
GET /products
Authorization: Bearer <accessToken>
```

Bu endpoint Redis cache kullanır. Create ve stock update işlemleri product list cache'ini invalid eder.

### 4.3 Ürün Detayı

```http
GET /products/{productId}
Authorization: Bearer <accessToken>
```

### 4.4 Stok Güncelle

```http
PATCH /products/{productId}/stock
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Body:

```json
{
  "stock": 20
}
```

---

## 5. Sipariş Akışı

Order Service, Saga orchestration uygular. Sipariş oluşturulduğunda:

1. Order kaydı oluşturulur.
2. Stok kontrol edilir.
3. Payment mock processor çağrılır.
4. Stok düşürülür.
5. Sipariş tamamlanır veya failure durumunda compensation çalışır.

### 5.1 Sipariş Oluştur

```http
POST /orders
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Body:

```json
{
  "userId": "demo-user-1",
  "items": [
    {
      "productId": "<productId>",
      "quantity": 2,
      "unitPrice": 2499.99
    }
  ]
}
```

Beklenen başarılı status:

```txt
COMPLETED
```

Yetersiz stok veya ödeme hatasında status:

```txt
FAILED
```

Cevaptaki `id` değerini `orderId` olarak sakla.

### 5.2 Siparişleri Listele

```http
GET /orders
Authorization: Bearer <accessToken>
```

### 5.3 Sipariş Detayı

```http
GET /orders/{orderId}
Authorization: Bearer <accessToken>
```

---

## 6. Ödeme Akışı

Payment Service normalde Order Saga içinde çağrılır. Manuel ödeme testleri için aşağıdaki endpoint'ler kullanılabilir.

### 6.1 Manuel Ödeme İşle

```http
POST /payments/process
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Body:

```json
{
  "orderId": "<orderId>",
  "userId": "demo-user-1",
  "amount": 4999.98,
  "shouldFail": false
}
```

Hata senaryosu test etmek için:

```json
{
  "orderId": "<orderId>",
  "userId": "demo-user-1",
  "amount": 4999.98,
  "shouldFail": true
}
```

### 6.2 Refund

```http
POST /payments/refund
Authorization: Bearer <accessToken>
Content-Type: application/json
```

Body:

```json
{
  "orderId": "<orderId>",
  "amount": 4999.98
}
```

### 6.3 Ödemeleri Listele

```http
GET /payments
Authorization: Bearer <accessToken>
```

### 6.4 Ödeme Detayı

```http
GET /payments/{paymentId}
Authorization: Bearer <accessToken>
```

### 6.5 Circuit Breaker Durumu

```http
GET /payments/circuit-breaker
Authorization: Bearer <accessToken>
```

Bu endpoint Circuit Breaker'ın `CLOSED`, `OPEN` veya `HALF_OPEN` durumunu gösterir.

---

## 7. Kafka Event Akışı

Kafka event flow servisler arasında arka planda çalışır.

| Topic | Üreten | Tüketen | Amaç |
| --- | --- | --- | --- |
| `order.created` | Order Service | Payment Service | Sipariş oluştu bilgisini yayar |
| `order.completed` | Order Service | Product Service | Tamamlanan sipariş sonrası stok event flow'u |
| `order.failed` | Order Service | - | Başarısız sipariş bilgisini yayar |
| `payment.succeeded` | Payment Service | - | Başarılı ödeme event'i |
| `payment.failed` | Payment Service | - | Başarısız ödeme event'i |
| `stock.decreased` | Product Service | - | Stok düşme başarılı event'i |
| `stock.failed` | Product Service | - | Stok düşme başarısız event'i |

Kafka topic'leri Docker Compose içindeki `kafka-init` servisi tarafından oluşturulur.

---

## 8. Observability

Her NestJS servisi Prometheus metriklerini `/metrics` endpoint'inden sunar.

API Gateway üzerinden:

```http
GET /metrics
```

Doğrudan servislerden:

```txt
http://localhost:3000/metrics
http://localhost:3001/metrics
http://localhost:3002/metrics
http://localhost:3003/metrics
```

Grafana:

```txt
http://localhost:3004
```

Login:

```txt
admin / admin
```

Prometheus:

```txt
http://localhost:9090
```

Tempo:

```txt
http://localhost:3200
```

OpenTelemetry local `nest start` sırasında varsayılan olarak kapalıdır. Açmak için:

```bash
OTEL_ENABLED=true OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 npx nest start api-gateway
```

Docker Compose app servislerinde `OTEL_ENABLED=true` otomatik verilir.

---

## 9. Önerilen Manuel Test Sırası

1. `GET /`
2. `POST /auth/register`
3. `POST /auth/login`
4. `POST /products`
5. `GET /products`
6. `GET /products/{productId}`
7. `PATCH /products/{productId}/stock`
8. `POST /orders`
9. `GET /orders/{orderId}`
10. `GET /payments`
11. `GET /payments/circuit-breaker`
12. `GET /metrics`
13. Grafana dashboard kontrolü
14. Prometheus target kontrolü

---

## 10. Postman Kullanımı

Hazır koleksiyon:

```txt
postman/omni-commerce-system.postman_collection.json
```

Koleksiyon değişkenleri:

| Değişken | Açıklama |
| --- | --- |
| `baseUrl` | API Gateway URL'i, varsayılan `http://localhost:3000` |
| `accessToken` | Register/Login sonrası JWT |
| `productId` | Ürün oluşturma sonrası ürün ID'si |
| `orderId` | Sipariş oluşturma sonrası sipariş ID'si |
| `paymentId` | Ödeme oluşturma sonrası ödeme ID'si |

Postman'de önce auth isteğini çalıştır, sonra dönen `accessToken` değerini collection variable olarak kaydet.

