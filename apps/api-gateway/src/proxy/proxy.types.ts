export type ServiceName = 'orders' | 'payments' | 'products';

export type HttpMethod = 'GET' | 'PATCH' | 'POST';

export type JsonValue =
  | JsonValue[]
  | boolean
  | null
  | number
  | string
  | { [key: string]: JsonValue };
