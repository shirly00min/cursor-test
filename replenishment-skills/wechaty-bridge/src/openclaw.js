import { config, openclawInboundUrl } from './config.js';
import { logger } from './logger.js';

export async function postInbound(payload) {
  const url = openclawInboundUrl();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.openclaw.apiKey}`,
    },
    body: JSON.stringify({
      ...payload,
      accountId: payload.accountId || config.openclaw.accountId,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenClaw inbound ${res.status}: ${body.slice(0, 500)}`);
  }

  logger.debug('inbound posted', {
    conversationId: payload.conversationId,
    messageKind: payload.metadata?.messageKind,
  });
}
