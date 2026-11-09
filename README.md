# Webhook Retry Service

Node / TypeScript service that ingests webhooks once, delivers them with exponential backoff, and dead-letters after a retry budget.

## Problem

Upstream partners deliver at-least-once. Downstream handlers time out.
You need idempotent intake, bounded retries, and a clear terminal state.

## Approach

- Intake keyed by `idempotency_key` (duplicates return the existing event)
- Dispatcher with backoff + jitter
- Dead-letter after max attempts
- In-memory store for local clarity (swap for Postgres without changing the policy)

Details: [ARCHITECTURE.md](./ARCHITECTURE.md)

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
    "idempotency_key": "evt_1001",
    "payload": {"amount_cents": 4200, "currency": "USD"}
  }'
```

## Stack

Node · TypeScript · Fastify · Zod · Vitest
