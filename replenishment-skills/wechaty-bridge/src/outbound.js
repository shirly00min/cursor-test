import crypto from 'node:crypto';
import express from 'express';
import { config } from './config.js';
import { logger } from './logger.js';
import { parseOutboundReady } from './outbound-ready.js';

export function createOutboundServer({ sendToRoom }) {
  const app = express();

  app.get(config.webhook.path, (_req, res) => {
    res.json({ ok: true, service: 'wechaty-bridge' });
  });

  app.post(
    config.webhook.path,
    express.raw({ type: 'application/json', limit: '2mb' }),
    async (req, res) => {
      try {
        const rawBody = req.body;
        if (!Buffer.isBuffer(rawBody)) {
          res.status(400).json({ error: 'expected raw body' });
          return;
        }

        if (config.webhook.secret) {
          const sig = req.headers['x-openclaw-signature'];
          if (!verifySignature(rawBody, sig, config.webhook.secret)) {
            logger.warn('webhook signature mismatch');
            res.status(401).json({ error: 'invalid signature' });
            return;
          }
        }

        const body = JSON.parse(rawBody.toString('utf8'));
        logger.debug('outbound webhook', {
          conversationId: body.conversationId,
          messageId: body.messageId,
        });

        const ready = parseOutboundReady(body.text);
        if (!ready) {
          logger.info('outbound ignored (no OUTBOUND_READY)', {
            conversationId: body.conversationId,
          });
          res.json({ ok: true, action: 'ignored' });
          return;
        }

        await sendToRoom(ready.roomTopic, ready.text, ready.mention);
        logger.info('outbound sent to room', { roomTopic: ready.roomTopic });
        res.json({ ok: true, action: 'sent', roomTopic: ready.roomTopic });
      } catch (err) {
        logger.error('outbound handler failed', { error: String(err) });
        res.status(500).json({ error: String(err) });
      }
    },
  );

  return app;
}

function verifySignature(rawBody, header, secret) {
  if (!header || typeof header !== 'string') return false;
  const expected =
    'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function startOutboundServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(config.webhook.port, config.webhook.host, () => {
      logger.info('outbound webhook listening', {
        url: `http://${config.webhook.host}:${config.webhook.port}${config.webhook.path}`,
      });
      resolve(server);
    });
  });
}
