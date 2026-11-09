import { describe, expect, it } from 'vitest';
import { WebhookStore } from '../src/lib/store.js';
import { WebhookDispatcher } from '../src/services/dispatcher.js';

describe('WebhookDispatcher', () => {
  it('does not re-dispatch a succeeded event', async () => {
    const store = new WebhookStore();
    let calls = 0;
    const dispatcher = new WebhookDispatcher(store, async () => {
      calls += 1;
    });

    const now = Date.now();
    store.save({
      id: '1',
      eventType: 'order.created',
      idempotencyKey: 'key-1',
      payload: {},
      status: 'pending',
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await dispatcher.processDue(now);
    await dispatcher.processDue(now + 10);

    expect(calls).toBe(1);
    expect(store.getByIdempotencyKey('key-1')?.status).toBe('succeeded');
  });

  it('retries on failure then succeeds', async () => {
    const store = new WebhookStore();
    let calls = 0;
    const dispatcher = new WebhookDispatcher(store, async () => {
      calls += 1;
      if (calls === 1) throw new Error('boom');
    });

    const now = Date.now();
    store.save({
      id: '2',
      eventType: 'payment.settled',
      idempotencyKey: 'key-2',
      payload: {},
      status: 'pending',
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await dispatcher.processDue(now);
    const afterFail = store.getByIdempotencyKey('key-2');
    expect(afterFail?.status).toBe('pending');
    expect(afterFail?.attempts).toBe(1);

    await dispatcher.processDue(afterFail!.nextAttemptAt);
    expect(store.getByIdempotencyKey('key-2')?.status).toBe('succeeded');
    expect(calls).toBe(2);
  });
});
