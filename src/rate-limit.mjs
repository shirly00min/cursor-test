import { RATE_LIMIT_PER_MINUTE } from "./config.mjs";

const buckets = new Map();

export function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60_000;
  let entry = buckets.get(userId);
  if (!entry || now - entry.start > windowMs) {
    entry = { start: now, count: 0 };
    buckets.set(userId, entry);
  }
  entry.count += 1;
  if (entry.count > RATE_LIMIT_PER_MINUTE) {
    return { ok: false, retryAfterSec: Math.ceil((entry.start + windowMs - now) / 1000) };
  }
  return { ok: true };
}
