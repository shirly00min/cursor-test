#!/usr/bin/env node
/**
 * 一键启用：检查配置 →（必要时）交互初始化 → 校验 OpenClaw Skill → 可选启动 bridge
 * 在本机 Cursor 终端执行：npm run wechat:enable
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { confirm, intro, note, outro, isCancel, cancel } from '@inquirer/prompts';
import { PATHS, REPO_ROOT } from './lib/paths.mjs';

function handleCancel(v) {
  if (isCancel(v)) {
    cancel('已取消');
    process.exit(0);
  }
  return v;
}

function exists(p) {
  return fs.existsSync(p);
}

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: opts.cwd || REPO_ROOT,
    env: { ...process.env, ...opts.env },
  });
}

function hasOpenClaw() {
  const r = spawnSync('openclaw', ['--version'], { stdio: 'pipe', encoding: 'utf8' });
  return r.status === 0;
}

function checkSkillLoaded() {
  const r = spawnSync('openclaw', ['skills', 'list'], { stdio: 'pipe', encoding: 'utf8' });
  if (r.status !== 0) return { ok: false, output: r.stderr || '' };
  const out = r.stdout || '';
  return { ok: /wechat-supplier-collab/i.test(out), output: out };
}

function readManifest() {
  if (!exists(PATHS.manifest)) return null;
  try {
    return JSON.parse(fs.readFileSync(PATHS.manifest, 'utf8'));
  } catch {
    return null;
  }
}

async function maybeMergeOpenClaw() {
  const home = os.homedir();
  const openclawPath = path.join(home, '.openclaw', 'openclaw.json');
  const snippetPath = PATHS.openclawSnippet;

  if (!exists(snippetPath)) {
    note('未找到 generated 配置片段，请先运行 npm run setup:wechat-supplier', 'OpenClaw');
    return;
  }

  if (!exists(openclawPath)) {
    note(
      [
        `未找到 ${openclawPath}`,
        '请手动创建 openclaw.json，或复制片段：',
        snippetPath,
      ].join('\n'),
      'OpenClaw',
    );
    return;
  }

  const raw = fs.readFileSync(openclawPath, 'utf8');
  const skillsDir = path.join(REPO_ROOT, 'skills').replace(/\\/g, '/');
  if (raw.includes('wechat-supplier-collab') && raw.includes(skillsDir)) {
    note('openclaw.json 中似乎已包含 wechat-supplier-collab 配置', 'OpenClaw');
    return;
  }

  const doMerge = handleCancel(
    await confirm({
      message: `是否将 Skill 配置合并进 ${openclawPath}？（会备份为 .bak）`,
      default: false,
    }),
  );

  if (!doMerge) {
    note(`请手动合并：${snippetPath}`, 'OpenClaw');
    return;
  }

  fs.copyFileSync(openclawPath, `${openclawPath}.bak.${Date.now()}`);
  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch {
    note('openclaw.json 不是纯 JSON（可能含 jsonc），请手动合并片段', 'OpenClaw');
    return;
  }

  cfg.skills = cfg.skills || {};
  cfg.skills.load = cfg.skills.load || {};
  const dirs = cfg.skills.load.extraDirs || [];
  if (!dirs.includes(skillsDir)) dirs.push(skillsDir);
  cfg.skills.load.extraDirs = dirs;
  cfg.skills.entries = cfg.skills.entries || {};
  cfg.skills.entries['wechat-supplier-collab'] = { enabled: true };
  cfg.agents = cfg.agents || {};
  cfg.agents.defaults = cfg.agents.defaults || {};
  const skills = new Set(cfg.agents.defaults.skills || []);
  skills.add('wechat-supplier-collab');
  cfg.agents.defaults.skills = [...skills];

  fs.writeFileSync(openclawPath, JSON.stringify(cfg, null, 2) + '\n', 'utf8');
  note(`已合并并备份原文件`, 'OpenClaw');
}

async function main() {
  const startBridge = process.argv.includes('--start-bridge');

  intro('供应商微信协同 · 一键启用');

  const manifest = readManifest();
  const needSetup =
    !manifest?.enabled ||
    !exists(PATHS.env) ||
    !exists(PATHS.registry) ||
    (fs.existsSync(PATHS.registry) &&
      fs.readFileSync(PATHS.registry, 'utf8').includes('suppliers: []'));

  if (needSetup) {
    note('首次使用或未完整配置，将启动交互式向导', '初始化');
    const child = spawn('node', ['scripts/setup-wechat-supplier.mjs'], {
      stdio: 'inherit',
      cwd: REPO_ROOT,
    });
    await new Promise((resolve, reject) => {
      child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`setup exit ${code}`))));
    });
  } else {
    note(`已配置 ${manifest.supplierCount ?? '?'} 个供应商群`, '配置');
  }

  const checks = [
    { ok: exists(PATHS.registry), label: 'suppliers-registry.yaml' },
    { ok: exists(PATHS.env), label: '.env' },
    { ok: exists(path.join(REPO_ROOT, 'skills/wechat-supplier-collab/SKILL.md')), label: 'SKILL.md' },
  ];
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    outro(`缺少文件：${failed.map((f) => f.label).join(', ')}`);
    process.exit(1);
  }

  note(checks.map((c) => `✅ ${c.label}`).join('\n'), '文件检查');

  if (!exists(path.join(REPO_ROOT, 'wechaty-bridge/node_modules'))) {
    note('正在安装 wechaty-bridge 依赖…', 'npm');
    const r = run('npm', ['install'], { cwd: path.join(REPO_ROOT, 'wechaty-bridge') });
    if (r.status !== 0) process.exit(r.status || 1);
  }

  await maybeMergeOpenClaw();

  if (hasOpenClaw()) {
    const { ok, output } = checkSkillLoaded();
    if (ok) {
      note('OpenClaw 已识别 wechat-supplier-collab', 'Skill');
    } else {
      note(
        [
          'openclaw skills list 中未看到 wechat-supplier-collab',
          '请确认 extraDirs 已指向本仓库 skills/ 并重启 Gateway',
          output ? `\n---\n${output.slice(0, 800)}` : '',
        ].join('\n'),
        'Skill',
      );
    }
  } else {
    note('未检测到 openclaw 命令，请安装 OpenClaw CLI 后执行：openclaw skills list', 'OpenClaw');
  }

  if (startBridge) {
    note('启动 wechaty-bridge（Ctrl+C 停止）', 'Bridge');
    const r = run('npm', ['start'], { cwd: path.join(REPO_ROOT, 'wechaty-bridge') });
    process.exit(r.status || 0);
  } else {
    const go = handleCancel(
      await confirm({
        message: '是否现在启动 wechaty-bridge？（需扫码登录微信）',
        default: false,
      }),
    );
    if (go) {
      note('启动中…', 'Bridge');
      run('npm', ['start'], { cwd: path.join(REPO_ROOT, 'wechaty-bridge') });
      return;
    }
  }

  outro(
    [
      'Skill 侧已就绪。完整链路还需要：',
      '  1. OpenClaw Gateway 运行中，且 REST channel 已配置',
      '  2. npm run wechat:bridge  启动 bridge 并扫码',
      '  3. 试点供应商群 @ 采购小号 → openclaw logs --follow',
      '',
      '命令：',
      '  npm run wechat:bridge   # 启动 bridge',
      '  npm run wechat:verify   # 检查配置',
      '  npm run wechat:setup    # 重新交互配置',
    ].join('\n'),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
