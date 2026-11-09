import Fastify from 'fastify';
import { WebhookStore } from './lib/store.js';
import { WebhookDispatcher } from './services/dispatcher.js';
import { webhookRoutes } from './routes/webhooks.js';

const store = new WebhookStore();

/** Demo downstream: fail first attempt for payment.settled to exercise retries. */
const dispatcher = new WebhookDispatcher(store, async (event) => {
  if (event.eventType === 'payment.settled' && event.attempts < 2) {
    throw new Error('downstream_timeout');
  }
});

const app = Fastify({ logger: true });

await webhookRoutes(app, store);

app.post('/v1/admin/tick', async () => {
  const processed = await dispatcher.processDue();
  return { processed };
});

const port = Number(process.env.PORT ?? 3100);
await app.listen({ port, host: '0.0.0.0' });

setInterval(() => {
  void dispatcher.processDue();
}, 1000);
