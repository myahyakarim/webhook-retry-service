import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { WebhookStore } from '../lib/store.js';

const bodySchema = z.object({
  event_type: z.string().min(1),
  idempotency_key: z.string().min(8),
  payload: z.unknown(),
});

export async function webhookRoutes(app: FastifyInstance, store: WebhookStore) {
  app.post('/v1/webhooks', async (req, reply) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(422).send({ error: 'invalid_body', details: parsed.error.flatten() });
    }

    const { event_type, idempotency_key, payload } = parsed.data;
    const existing = store.getByIdempotencyKey(idempotency_key);
    if (existing) {
      return reply.code(200).send({
        status: existing.status,
        id: existing.id,
        replayed: true,
      });
    }

    const now = Date.now();
    const event = {
      id: randomUUID(),
      eventType: event_type,
      idempotencyKey: idempotency_key,
      payload,
      status: 'pending' as const,
      attempts: 0,
      nextAttemptAt: now,
      createdAt: now,
      updatedAt: now,
    };
    store.save(event);

    return reply.code(202).send({
      status: 'accepted',
      id: event.id,
      replayed: false,
    });
  });

  app.get('/v1/webhooks', async () => ({ data: store.list() }));

  app.get('/health', async () => ({ ok: true }));
}
