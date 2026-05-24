import { config } from './config.js';
import { createBot, sendToRoom } from './bot.js';
import { assertFeatureEnabled } from './manifest.js';
import { logger } from './logger.js';
import { createOutboundServer, startOutboundServer } from './outbound.js';
import { loadRegistry } from './registry.js';

async function main() {
  const manifest = assertFeatureEnabled();
  if (manifest.enabled === null) {
    logger.warn(
      '未检测到 feature.manifest.json，建议先运行：cd .. && npm run setup:wechat-supplier',
    );
  }

  logger.info('starting wechaty-bridge', {
    registry: config.registryPath,
    openclaw: config.openclaw.gatewayUrl,
    webhookPort: config.webhook.port,
  });

  loadRegistry();

  const bot = createBot();

  const app = createOutboundServer({
    sendToRoom: (roomTopic, text, mention) => sendToRoom(bot, roomTopic, text, mention),
  });

  await startOutboundServer(app);
  await bot.start();

  logger.info('wechaty-bridge ready — scan QR in terminal if using wechat4u');
}

main().catch((err) => {
  logger.error('fatal', { error: String(err) });
  process.exit(1);
});
