export type WebhookStatus = 'pending' | 'processing' | 'succeeded' | 'dead';

export type WebhookEvent = {
  id: string;
  eventType: string;
  idempotencyKey: string;
  payload: unknown;
  status: WebhookStatus;
  attempts: number;
  nextAttemptAt: number;
  lastError?: string;
  createdAt: number;
  updatedAt: number;
};

/**
 * In-memory store for local development.
 * Swap for Postgres/Redis in production without changing the retry policy.
 */
export class WebhookStore {
  private readonly byKey = new Map<string, WebhookEvent>();

  getByIdempotencyKey(key: string): WebhookEvent | undefined {
    return this.byKey.get(key);
  }

  save(event: WebhookEvent): void {
    this.byKey.set(event.idempotencyKey, event);
  }

  list(): WebhookEvent[] {
    return [...this.byKey.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  due(now = Date.now()): WebhookEvent[] {
    return this.list().filter(
      (e) =>
        (e.status === 'pending' || e.status === 'processing') &&
        e.nextAttemptAt <= now &&
        e.status !== 'succeeded' &&
        e.status !== 'dead',
    );
  }
}
