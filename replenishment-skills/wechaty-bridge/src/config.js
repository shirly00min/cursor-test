import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const bridgeRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(bridgeRoot, '.env') });

function required(name, value) {
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

const registryPath = process.env.SUPPLIERS_REGISTRY_PATH
  ? path.resolve(bridgeRoot, process.env.SUPPLIERS_REGISTRY_PATH)
  : path.resolve(
      bridgeRoot,
      '../skills/wechat-supplier-collab/references/suppliers-registry.example.yaml',
    );

export const config = {
  bridgeRoot,
  registryPath,
  wechatyPuppet: process.env.WECHATY_PUPPET || 'wechaty-puppet-wechat4u',
  wechat4uToken: process.env.WECHATY_PUPPET_WECHAT4U_TOKEN || '',
  openclaw: {
    gatewayUrl: (process.env.OPENCLAW_GATEWAY_URL || 'http://127.0.0.1:18789').replace(
      /\/$/,
      '',
    ),
    inboundPath: process.env.OPENCLAW_INBOUND_PATH || '/rest/inbound',
    apiKey: required('OPENCLAW_INBOUND_API_KEY', process.env.OPENCLAW_INBOUND_API_KEY),
    accountId: process.env.OPENCLAW_ACCOUNT_ID || 'default',
  },
  webhook: {
    host: process.env.WEBHOOK_HOST || '0.0.0.0',
    port: Number(process.env.WEBHOOK_PORT || 8787),
    path: process.env.WEBHOOK_PATH || '/openclaw/outbound',
    secret: process.env.OPENCLAW_WEBHOOK_SECRET || '',
  },
  procurementContactIds: (process.env.PROCUREMENT_CONTACT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  dedupeTtlMs: Number(process.env.DEDUPE_TTL_MS || 24 * 60 * 60 * 1000),
};

export function openclawInboundUrl() {
  return `${config.openclaw.gatewayUrl}${config.openclaw.inboundPath}`;
}
