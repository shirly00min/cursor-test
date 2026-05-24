import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(__dirname, '../..');
export const BRIDGE_DIR = path.join(REPO_ROOT, 'wechaty-bridge');
export const SKILL_DIR = path.join(REPO_ROOT, 'skills', 'wechat-supplier-collab');

export const PATHS = {
  env: path.join(BRIDGE_DIR, '.env'),
  envExample: path.join(BRIDGE_DIR, '.env.example'),
  registry: path.join(BRIDGE_DIR, 'config', 'suppliers-registry.yaml'),
  manifest: path.join(BRIDGE_DIR, 'config', 'feature.manifest.json'),
  openclawSnippet: path.join(REPO_ROOT, 'config', 'openclaw-wechat-supplier.generated.jsonc'),
};
