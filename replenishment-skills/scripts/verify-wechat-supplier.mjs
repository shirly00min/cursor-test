#!/usr/bin/env node
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import yaml from 'yaml';
import { PATHS } from './lib/paths.mjs';

const ok = (m) => console.log(`✅ ${m}`);
const warn = (m) => console.log(`⚠️  ${m}`);
const fail = (m) => console.log(`❌ ${m}`);

console.log('\n供应商微信协同 · 配置检查\n');

if (fs.existsSync(PATHS.manifest)) {
  const m = JSON.parse(fs.readFileSync(PATHS.manifest, 'utf8'));
  m.enabled ? ok(`功能已启用 (${m.supplierCount ?? 0} 群)`) : warn('feature.manifest: enabled=false');
} else {
  fail('未运行过初始化：npm run wechat:enable');
}

fs.existsSync(PATHS.env) ? ok('.env 存在') : fail('缺少 wechaty-bridge/.env');
fs.existsSync(PATHS.registry) ? ok('suppliers-registry.yaml 存在') : fail('缺少注册表');

if (fs.existsSync(PATHS.registry)) {
  const doc = yaml.parse(fs.readFileSync(PATHS.registry, 'utf8'));
  const n = doc.suppliers?.length ?? 0;
  n > 0 ? ok(`已登记 ${n} 个供应商群`) : warn('供应商群列表为空');
}

const oc = spawnSync('openclaw', ['skills', 'list'], { encoding: 'utf8' });
if (oc.status === 0) {
  /wechat-supplier-collab/i.test(oc.stdout || '')
    ? ok('OpenClaw 已加载 wechat-supplier-collab')
    : warn('OpenClaw 未列出 wechat-supplier-collab（检查 extraDirs + 重启 Gateway）');
} else {
  warn('openclaw CLI 不可用，跳过 Skill 检查');
}

console.log('');
