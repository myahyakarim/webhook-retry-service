# Architecture — Webhook Retry Service

At-least-once webhook intake with bounded delivery retries.

## Problem

Partners deliver webhooks at-least-once. Downstream handlers time out or fail transiently.
Blind reprocessing without keys creates duplicates; no backoff creates thundering herds.

## Design goals

1. Idempotent intake (`idempotency_key`)
2. Exponential backoff with jitter
3. Dead-letter after a fixed attempt budget
4. Retry policy independent of storage

## Flow

```
POST /v1/webhooks
      │
      ▼
 existing key? ──yes──► return existing event (replayed)
      │
      no
      ▼
 persist pending event
      │
      ▼
 worker tick / admin tick
      │
      ▼
 dispatch ──success──► succeeded
      │
      fail
      ▼
 attempts < max ? pending(+delay) : dead
```

## Tradeoffs

| Choice | Why |
|--------|-----|
| In-memory store | Simple local runs; replace with Postgres/Redis in production |
| Separate dispatcher | Policy is unit-testable without HTTP |
| Admin `/v1/admin/tick` | Makes delivery deterministic in development |

## Out of scope

- Signature verification per partner
- Multi-tenant routing
- Exactly-once downstream guarantees (not achievable over plain HTTP)
