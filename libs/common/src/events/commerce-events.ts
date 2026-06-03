export const KAFKA_CLIENT = Symbol('KAFKA_CLIENT');

export const CommerceTopics = {
  OrderCompleted: 'order.completed',
  OrderCreated: 'order.created',
  OrderFailed: 'order.failed',
  PaymentFailed: 'payment.failed',
  PaymentSucceeded: 'payment.succeeded',
  StockDecreased: 'stock.decreased',
  StockFailed: 'stock.failed',
} as const;

export type CommerceTopic =
  (typeof CommerceTopics)[keyof typeof CommerceTopics];

export interface CommerceEvent<TPayload> {
  occurredAt: string;
  payload: TPayload;
}

export interface ProductStockItemPayload {
  productId: string;
  quantity: number;
}

export interface OrderEventPayload {
  failureReason?: string;
  items: ProductStockItemPayload[];
  orderId: string;
  status: string;
  totalAmount: string;
  userId: string;
}

export interface PaymentEventPayload {
  amount: string;
  failureReason?: string;
  orderId: string;
  paymentId: string;
  status: string;
  userId: string;
}

export interface StockEventPayload {
  failureReason?: string;
  items: ProductStockItemPayload[];
  orderId: string;
}
