import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { CircuitBreakerState } from './circuit-breaker-state.enum';

export interface CircuitBreakerSnapshot {
  failureCount: number;
  openedAt: Date | null;
  state: CircuitBreakerState;
}

@Injectable()
export class CircuitBreakerService {
  private failureCount = 0;
  private openedAt: Date | null = null;
  private state = CircuitBreakerState.Closed;
  private readonly failureThreshold = 3;
  private readonly openTimeoutMs = 30_000;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.assertRequestAllowed();

    try {
      const result = await operation();
      this.recordSuccess();

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  getSnapshot(): CircuitBreakerSnapshot {
    this.refreshState();

    return {
      failureCount: this.failureCount,
      openedAt: this.openedAt,
      state: this.state,
    };
  }

  private assertRequestAllowed(): void {
    this.refreshState();

    if (this.state === CircuitBreakerState.Open) {
      throw new ServiceUnavailableException('Payment circuit breaker is open');
    }
  }

  private recordSuccess(): void {
    this.failureCount = 0;
    this.openedAt = null;
    this.state = CircuitBreakerState.Closed;
  }

  private recordFailure(): void {
    this.failureCount += 1;

    if (this.failureCount >= this.failureThreshold) {
      this.state = CircuitBreakerState.Open;
      this.openedAt = new Date();
    }
  }

  private refreshState(): void {
    if (
      this.state === CircuitBreakerState.Open &&
      this.openedAt &&
      Date.now() - this.openedAt.getTime() >= this.openTimeoutMs
    ) {
      this.state = CircuitBreakerState.HalfOpen;
    }
  }
}
