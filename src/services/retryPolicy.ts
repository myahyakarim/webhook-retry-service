/** Exponential backoff with jitter — senior default for webhook delivery. */
export function nextDelayMs(attempt: number): number {
  const base = Math.min(60_000, 500 * 2 ** Math.max(0, attempt - 1));
  const jitter = Math.floor(Math.random() * 250);
  return base + jitter;
}

export const MAX_ATTEMPTS = 5;
