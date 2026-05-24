import fs from 'node:fs';
import yaml from 'yaml';
import { config } from './config.js';
import { logger } from './logger.js';

let cache = null;
let cacheMtime = 0;

export function loadRegistry() {
  const stat = fs.statSync(config.registryPath);
  if (cache && stat.mtimeMs === cacheMtime) {
    return cache;
  }

  const raw = fs.readFileSync(config.registryPath, 'utf8');
  const doc = yaml.parse(raw);
  const defaults = doc.defaults || {};
  const byTopic = new Map();

  for (const s of doc.suppliers || []) {
    if (!s.roomTopic) continue;
    byTopic.set(s.roomTopic, { ...defaults, ...s });
  }

  cache = { defaults, byTopic, internal: doc.internal || {} };
  cacheMtime = stat.mtimeMs;
  logger.info('registry loaded', {
    path: config.registryPath,
    suppliers: byTopic.size,
  });
  return cache;
}

export function findSupplierByRoomTopic(topic) {
  const reg = loadRegistry();
  return reg.byTopic.get(topic) || null;
}
