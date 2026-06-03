import { ServiceUnavailableException } from '@nestjs/common';

import { CircuitBreakerState } from './circuit-breaker-state.enum';
import { CircuitBreakerService } from './circuit-breaker.service';

describe('CircuitBreakerService', () => {
  let service: CircuitBreakerService;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    service = new CircuitBreakerService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts closed and records successful operations', async () => {
    await expect(service.execute(() => Promise.resolve('ok'))).resolves.toBe(
      'ok',
    );

    expect(service.getSnapshot()).toEqual({
      failureCount: 0,
      openedAt: null,
      state: CircuitBreakerState.Closed,
    });
  });

  it('opens after the failure threshold is reached', async () => {
    await expectFailure();
    await expectFailure();
    await expectFailure();

    const snapshot = service.getSnapshot();

    expect(snapshot.failureCount).toBe(3);
    expect(snapshot.openedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    expect(snapshot.state).toBe(CircuitBreakerState.Open);
    await expect(service.execute(() => Promise.resolve())).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('moves to half-open after timeout and closes on success', async () => {
    await expectFailure();
    await expectFailure();
    await expectFailure();

    jest.advanceTimersByTime(30_000);

    expect(service.getSnapshot().state).toBe(CircuitBreakerState.HalfOpen);
    await service.execute(() => Promise.resolve());

    expect(service.getSnapshot()).toEqual({
      failureCount: 0,
      openedAt: null,
      state: CircuitBreakerState.Closed,
    });
  });

  async function expectFailure(): Promise<void> {
    await expect(
      service.execute(() => Promise.reject(new Error('processor failed'))),
    ).rejects.toThrow('processor failed');
  }
});
