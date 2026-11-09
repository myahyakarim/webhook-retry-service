import { MAX_ATTEMPTS, nextDelayMs } from './retryPolicy.js';
import type { WebhookEvent, WebhookStore } from '../lib/store.js';

export type DownstreamHandler = (event: WebhookEvent) => Promise<void>;

export class WebhookDispatcher {
  constructor(
    private readonly store: WebhookStore,
    private readonly handler: DownstreamHandler,
  ) {}

  async processDue(now = Date.now()): Promise<number> {
    const due = this.store.due(now);
    for (const event of due) {
      await this.processOne(event, now);
    }
    return due.length;
  }

  private async processOne(event: WebhookEvent, now: number): Promise<void> {
    event.status = 'processing';
    event.attempts += 1;
    event.updatedAt = now;
    this.store.save(event);

    try {
      await this.handler(event);
      event.status = 'succeeded';
      event.lastError = undefined;
      event.updatedAt = Date.now();
      this.store.save(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'unknown error';
      event.lastError = message;
      event.updatedAt = Date.now();

      if (event.attempts >= MAX_ATTEMPTS) {
        event.status = 'dead';
      } else {
        event.status = 'pending';
        event.nextAttemptAt = Date.now() + nextDelayMs(event.attempts);
      }
      this.store.save(event);
    }
  }
}
