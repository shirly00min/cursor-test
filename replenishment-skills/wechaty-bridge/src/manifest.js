import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { logger } from './logger.js';

const manifestPath = path.join(config.bridgeRoot, 'config', 'feature.manifest.json');

export function loadFeatureManifest() {
  if (!fs.existsSync(manifestPath)) {
    return { enabled: null, bridgeProcessing: true };
  }
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (err) {
    logger.warn('failed to read feature.manifest.json', { error: String(err) });
    return { enabled: null, bridgeProcessing: true };
  }
}

export function assertFeatureEnabled() {
  const m = loadFeatureManifest();
  if (m.enabled === false) {
    throw new Error(
      '供应商微信协同未启用。请在 replenishment-skills 根目录运行：npm run setup:wechat-supplier',
    );
  }
  if (m.bridgeProcessing === false) {
    logger.warn('feature.manifest: bridgeProcessing=false，仍将启动 bridge（仅记录）');
  }
  return m;
}
