const seen = new Map();

export function shouldProcess(messageId, ttlMs) {
  const now = Date.now();
  for (const [id, exp] of seen) {
    if (exp <= now) seen.delete(id);
  }
  if (seen.has(messageId)) {
    return false;
  }
  seen.set(messageId, now + ttlMs);
  return true;
}
