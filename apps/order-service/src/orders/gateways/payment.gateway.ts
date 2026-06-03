import { Injectable } from '@nestjs/common';

@Injectable()
export class PaymentGateway {
  processPayment(orderId: string, amount: number): Promise<void> {
    if (!orderId || amount <= 0) {
      return Promise.reject(new Error('Payment request is invalid'));
    }

    return Promise.resolve();
  }

  refundPayment(orderId: string, amount: number): Promise<void> {
    if (!orderId || amount <= 0) {
      return Promise.reject(new Error('Refund request is invalid'));
    }

    return Promise.resolve();
  }
}
