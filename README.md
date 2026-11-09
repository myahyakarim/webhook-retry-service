# Webhook Retry Service

> Senior Node/TypeScript demo: **ingest once, deliver with backoff, dead-letter after budget.**

Clean-room portfolio service. No employer code or brands.

## Problem

Payment / partner webhooks arrive at-least-once. Downstream handlers time out.
You need:

1. Idempotent intake (`idempotency_key`)
2. Retry with exponential backoff + jitter
3. Dead-letter after N attempts
4. An admin “tick” (or worker loop) that is safe to run repeatedly

## Run

```bash
npm install
npm test
npm run dev
```

```bash
curl -X POST http://127.0.0.1:3100/v1/webhooks \
  -H 'Content-Type: application/json' \
  -d '{
    "event_type": "payment.settled",
    "idempotency_key": "evt_demo_001",
    "payload": {"amount_cents": 4200, "currency": "USD"}
  }'
```

Duplicate POST with the same key returns `replayed: true` without creating a second event.

## Architecture notes

- In-memory store for demo clarity — swap for Postgres without changing retry policy
- Dispatcher is pure application logic (easy to unit test)
- `payment.settled` fails once on purpose in the demo handler to show retries

## Stack

Node 20+ · TypeScript · Fastify · Zod · Vitest
