import { Injectable } from '@nestjs/common';

@Injectable()
export class MockPaymentProcessorService {
  process(amount: number, shouldFail: boolean): Promise<void> {
    if (amount <= 0) {
      return Promise.reject(new Error('Payment amount must be positive'));
    }

    if (shouldFail) {
      return Promise.reject(new Error('Mock payment processor failed'));
    }

    return Promise.resolve();
  }

  refund(amount: number): Promise<void> {
    if (amount <= 0) {
      return Promise.reject(new Error('Refund amount must be positive'));
    }

    return Promise.resolve();
  }
}
