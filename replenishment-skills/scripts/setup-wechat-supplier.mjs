#!/usr/bin/env node
/**
 * 交互式初始化：供应商微信协同（Skill + wechaty-bridge）
 * 用法：npm run setup:wechat-supplier
 */
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'yaml';
import {
  confirm,
  input,
  password,
  select,
  checkbox,
  intro,
  outro,
  note,
  isCancel,
  cancel,
} from '@inquirer/prompts';
import { PATHS, REPO_ROOT } from './lib/paths.mjs';
import {
  writeEnv,
  writeManifest,
  writeOpenClawSnippet,
  writeRegistry,
} from './lib/write-config.mjs';

const LISTEN_MODES = [
  {
    value: 'at_me_only',
    name: '仅 @ 采购小号时处理（推荐）',
    description: '群里不 @ 不上报 OpenClaw，不自动回复',
  },
  {
    value: 'archive_only',
    name: '静默归档（只收集、不在群里回复）',
    description: '所有群消息入站归档，不触发自动回复',
  },
];

const CATEGORIES = [
  { value: 'replenishment', name: '补货' },
  { value: 'reconciliation', name: '对账' },
  { value: 'quality', name: '质检' },
  { value: 'other', name: '其他' },
];

function handleCancel(value) {
  if (isCancel(value)) {
    cancel('已取消配置，未写入文件。');
    process.exit(0);
  }
  return value;
}

function loadExistingRegistrySync() {
  if (!fs.existsSync(PATHS.registry)) {
    return {
      suppliers: [],
      defaults: {
        listenMode: 'at_me_only',
        approvalRequired: true,
        allowAutoOutbound: false,
        language: 'zh-CN',
      },
    };
  }
  try {
    const doc = yaml.parse(fs.readFileSync(PATHS.registry, 'utf8'));
    return {
      suppliers: doc.suppliers || [],
      defaults: doc.defaults || {
        listenMode: 'at_me_only',
        approvalRequired: true,
        allowAutoOutbound: false,
        language: 'zh-CN',
      },
    };
  } catch {
    return { suppliers: [], defaults: {} };
  }
}

async function promptAddSupplier(existingTopics) {
  const suppliers = [];

  while (true) {
    note(
      [
        '提示：微信群名称要与微信里显示的群名 **完全一致**（含标点、空格）。',
        '可在微信里长按群名 → 复制群名称。',
      ].join('\n'),
      `供应商群 ${suppliers.length + 1}`,
    );

    const roomTopic = handleCancel(
      await input({
        message: '微信群名称（roomTopic）',
        validate: (v) => {
          if (!v?.trim()) return '请输入群名';
          if (existingTopics.has(v.trim()) || suppliers.some((s) => s.roomTopic === v.trim())) {
            return '该群已在列表中';
          }
          return true;
        },
      }),
    );

    const supplierName = handleCancel(
      await input({
        message: '供应商名称',
        default: roomTopic.slice(0, 20),
      }),
    );

    const supplierId = handleCancel(
      await input({
        message: '供应商 ID（内部编号）',
        default: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
      }),
    );

    const listenMode = handleCancel(
      await select({
        message: '群消息处理方式',
        choices: LISTEN_MODES,
      }),
    );

    const category = handleCancel(
      await select({
        message: '业务类别',
        choices: CATEGORIES,
      }),
    );

    const ownerProcurement = handleCancel(
      await input({
        message: '采控负责人（姓名或工号）',
        default: '',
      }),
    );

    const enabled = handleCancel(
      await confirm({
        message: '是否启用该群的处理？',
        default: true,
      }),
    );

    if (enabled) {
      suppliers.push({
        supplierId: supplierId.trim(),
        supplierName: supplierName.trim(),
        roomTopic: roomTopic.trim(),
        category,
        ownerProcurement: ownerProcurement.trim() || undefined,
        listenMode,
        tags: [],
      });
      existingTopics.add(roomTopic.trim());
    } else {
      note(`已跳过群「${roomTopic}」（未加入白名单）`, '跳过');
    }

    const more = handleCancel(
      await confirm({
        message: '继续添加下一个供应商群？',
        default: suppliers.length < 3,
      }),
    );
    if (!more) break;
  }

  return suppliers;
}

async function main() {
  intro('供应商微信协同 · 初始化向导');
  note(
    [
      '将引导你完成：',
      '  · 是否启用本功能',
      '  · OpenClaw / Bridge 连接',
      '  · 供应商微信群与处理策略',
      '  · 采控账号与 Skill 配置片段',
      '',
      `仓库目录：${REPO_ROOT}`,
    ].join('\n'),
  );

  const enableFeature = handleCancel(
    await confirm({
      message: '是否启用「供应商微信协同」功能？',
      default: true,
    }),
  );

  if (!enableFeature) {
    writeManifest(PATHS.manifest, {
      enabled: false,
      setupVersion: '1',
      setupCompletedAt: new Date().toISOString(),
      message: '用户选择暂不启用',
    });
    outro('已记录为未启用。需要时可重新运行：npm run setup:wechat-supplier');
    return;
  }

  const existing = loadExistingRegistrySync();
  const existingTopics = new Set((existing.suppliers || []).map((s) => s.roomTopic));

  let mergeMode = 'replace';
  if (existing.suppliers.length > 0) {
    mergeMode = handleCancel(
      await select({
        message: `检测到已有 ${existing.suppliers.length} 个群配置，如何处理？`,
        choices: [
          { value: 'append', name: '保留已有，并追加新群' },
          { value: 'replace', name: '重新配置（覆盖 suppliers-registry.yaml）' },
        ],
      }),
    );
  }

  note('OpenClaw Gateway 连接', '步骤 1/4');

  const gatewayUrl = handleCancel(
    await input({
      message: 'OpenClaw Gateway 地址',
      default: 'http://127.0.0.1:18789',
    }),
  );

  const inboundApiKey = handleCancel(
    await password({
      message: 'REST 入站 API Key（OPENCLAW_INBOUND_API_KEY）',
      mask: '*',
      validate: (v) => (v?.length >= 8 ? true : '建议至少 8 位'),
    }),
  );

  const webhookSecret = handleCancel(
    await password({
      message: '出站 Webhook 密钥（OPENCLAW_WEBHOOK_SECRET）',
      mask: '*',
      validate: (v) => (v?.length >= 8 ? true : '建议至少 8 位'),
    }),
  );

  const webhookPort = handleCancel(
    await input({
      message: 'Bridge 出站监听端口',
      default: '8787',
      validate: (v) => (/^\d+$/.test(v) ? true : '请输入端口号'),
    }),
  );

  const bridgeProcessing = handleCancel(
    await confirm({
      message: '启用 wechaty-bridge 自动处理微信消息？',
      default: true,
    }),
  );

  note('供应商微信群', '步骤 2/4');

  let suppliers = existing.suppliers;
  if (mergeMode === 'replace') {
    suppliers = [];
  }

  const addNew = handleCancel(
    await confirm({
      message:
        mergeMode === 'append'
          ? '是否添加新的供应商群？'
          : '开始配置供应商群列表（至少建议添加 1 个试点群）',
      default: true,
    }),
  );

  if (addNew) {
    const added = await promptAddSupplier(existingTopics);
    suppliers = mergeMode === 'append' ? [...suppliers, ...added] : added;
  }

  if (suppliers.length === 0) {
    note('未配置任何供应商群，bridge 将不会处理群消息。', '警告');
  }

  note('采控与策略', '步骤 3/4');

  const procurementRaw = handleCancel(
    await input({
      message: '采控微信号（wxid，多个用英文逗号分隔，可稍后在 .env 补填）',
      default: '',
    }),
  );

  const defaultListenMode = handleCancel(
    await select({
      message: '新群默认处理方式（写入 defaults）',
      choices: LISTEN_MODES,
      default: 'at_me_only',
    }),
  );

  const processingFeatures = handleCancel(
    await checkbox({
      message: '启用哪些自动化能力？（对外发群仍须采控确认）',
      choices: [
        {
          value: 'digest',
          name: '对内日报（工作日 18:00，需自行配置 OpenClaw Cron）',
          checked: true,
        },
        {
          value: 'followup',
          name: '对内早间待办跟进（需 Cron）',
          checked: true,
        },
        {
          value: 'health',
          name: 'POC 健康检查（仅试点环境）',
          checked: false,
        },
      ],
    }),
  );

  const defaults = {
    listenMode: defaultListenMode,
    approvalRequired: true,
    allowAutoOutbound: false,
    language: 'zh-CN',
  };

  note('确认配置', '步骤 4/4');

  const summary = [
    '启用功能：是',
    `Bridge 自动处理：${bridgeProcessing ? '是' : '否'}`,
    `Gateway：${gatewayUrl}`,
    `Webhook：http://127.0.0.1:${webhookPort}/openclaw/outbound`,
    `供应商群数量：${suppliers.length}`,
    ...suppliers.map(
      (s) => `  · ${s.roomTopic} → ${s.listenMode}${s.category ? ` [${s.category}]` : ''}`,
    ),
    `采控微信号：${procurementRaw || '（未填）'}`,
    `自动化：${processingFeatures.join(', ') || '无'}`,
  ].join('\n');

  note(summary, '配置摘要');

  const proceed = handleCancel(
    await confirm({
      message: '确认写入配置文件？',
      default: true,
    }),
  );

  if (!proceed) {
    outro('未写入。可重新运行向导。');
    return;
  }

  writeRegistry(PATHS.registry, {
    defaults,
    suppliers,
    internal: { procurementDigestConversationId: 'internal:procurement' },
  });

  writeEnv(PATHS.env, {
    WECHATY_PUPPET: 'wechaty-puppet-wechat4u',
    WECHATY_PUPPET_WECHAT4U_TOKEN: '',
    OPENCLAW_GATEWAY_URL: gatewayUrl.replace(/\/$/, ''),
    OPENCLAW_INBOUND_PATH: '/rest/inbound',
    OPENCLAW_INBOUND_API_KEY: inboundApiKey,
    OPENCLAW_ACCOUNT_ID: 'default',
    WEBHOOK_HOST: '0.0.0.0',
    WEBHOOK_PORT: webhookPort,
    WEBHOOK_PATH: '/openclaw/outbound',
    OPENCLAW_WEBHOOK_SECRET: webhookSecret,
    SUPPLIERS_REGISTRY_PATH: './config/suppliers-registry.yaml',
    PROCUREMENT_CONTACT_IDS: procurementRaw.replace(/\s+/g, ''),
    LOG_LEVEL: 'info',
  });

  writeManifest(PATHS.manifest, {
    enabled: true,
    bridgeProcessing,
    setupVersion: '1',
    setupCompletedAt: new Date().toISOString(),
    automation: {
      digest: processingFeatures.includes('digest'),
      followup: processingFeatures.includes('followup'),
      health: processingFeatures.includes('health'),
    },
    supplierCount: suppliers.length,
  });

  writeOpenClawSnippet(PATHS.openclawSnippet, {
    extraDir: path.join(REPO_ROOT, 'skills'),
    repoRoot: REPO_ROOT,
  });

  if (processingFeatures.includes('digest') || processingFeatures.includes('followup')) {
    note(
      `Cron 提示词见：${path.join(REPO_ROOT, 'skills/wechat-supplier-collab/references/cron-prompts.md')}`,
      'Cron',
    );
  }

  outro(
    [
      '配置已写入：',
      `  · ${PATHS.registry}`,
      `  · ${PATHS.env}`,
      `  · ${PATHS.manifest}`,
      `  · ${PATHS.openclawSnippet}`,
      '',
      '下一步：',
      '  1. 合并 config/openclaw-wechat-supplier.generated.jsonc → ~/.openclaw/openclaw.json',
      '  2. cd wechaty-bridge && npm install && npm start',
      '  3. 采购小号扫码，在试点群 @ 小号测试',
      '  4. openclaw logs --follow',
      '',
      '重新配置：npm run setup:wechat-supplier',
    ].join('\n'),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
