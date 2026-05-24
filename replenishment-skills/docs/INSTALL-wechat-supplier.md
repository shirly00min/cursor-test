# 安装 wechat-supplier-collab（Mac / AIproject）

## 1. 交互式初始化（推荐）

```bash
cd /Users/liuqiang1/AIproject/replenishment-skills
npm install
npm run setup:wechat-supplier
```

按提示完成：启用开关、Gateway/API、供应商 **微信群名**、**@ 触发 / 静默归档**、采控 wxid、自动化选项。

生成文件：

- `wechaty-bridge/.env`
- `wechaty-bridge/config/suppliers-registry.yaml`
- `wechaty-bridge/config/feature.manifest.json`
- `config/openclaw-wechat-supplier.generated.jsonc`

## 2. 确认目录

```bash
ls skills/wechat-supplier-collab/SKILL.md
ls wechaty-bridge/src/index.js
```

若 `git pull` 后没有该目录，请拉取包含本 Skill 的分支。

## 3. 配置 OpenClaw 加载技能包

编辑 `~/.openclaw/openclaw.json`，合并 `config/openclaw-replenishment-skills.jsonc` 中的 `skills` 段。

或一键追加 `extraDirs`（请确认路径存在）：

```bash
export REPO="/Users/liuqiang1/AIproject/replenishment-skills"
# 手动编辑 openclaw.json 更稳妥；以下为检查项
test -d "$REPO/skills/wechat-supplier-collab" && echo "Skill 目录 OK"
```

## 4. 启动 wechaty-bridge（本仓库内）

```bash
cd /Users/liuqiang1/AIproject/replenishment-skills/wechaty-bridge
cp .env.example .env
# 编辑 OPENCLAW_*、SUPPLIERS_REGISTRY_PATH、PROCUREMENT_CONTACT_IDS
npm install
npm start
```

详见：`wechaty-bridge/README.md`

## 5. 配置 REST Channel

- 安装：`openclaw-rest-channel`（npm / 插件）
- 参考：`skills/wechat-supplier-collab/references/openclaw-rest-snippet.example.jsonc`
- `webhookUrl`: `http://127.0.0.1:8787/openclaw/outbound`（与 bridge `.env` 一致）
- Bridge 契约：`skills/wechat-supplier-collab/references/bridge-inbound-metadata.md`

## 6. 供应商群注册表（未跑向导时）

```bash
npm run setup:wechat-supplier
# 或手动：编辑 wechaty-bridge/config/suppliers-registry.yaml
```

## 7. 环境变量（可选）

```bash
export WECHAT_SUPPLIER_SKILL_HOME="/Users/liuqiang1/AIproject/replenishment-skills/skills/wechat-supplier-collab"
export REPLENISHMENT_SKILLS_HOME="/Users/liuqiang1/AIproject/replenishment-skills"
```

## 8. 验证

```bash
openclaw skills list | grep wechat-supplier
openclaw channels status --probe
# bridge 跑通后：openclaw logs --follow
```

## 9. POC

在采控会话发送：**「执行微信供应商 POC 健康检查」** → 触发 Skill §5.6 `health-check`。
