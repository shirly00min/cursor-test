# 安装 wechat-supplier-collab（Mac / AIproject）

## 1. 确认目录

```bash
cd /Users/liuqiang1/AIproject/replenishment-skills
ls skills/wechat-supplier-collab/SKILL.md
```

若 `git pull` 后没有该目录，请拉取包含本 Skill 的分支。

## 2. 配置 OpenClaw 加载技能包

编辑 `~/.openclaw/openclaw.json`，合并 `config/openclaw-replenishment-skills.jsonc` 中的 `skills` 段。

或一键追加 `extraDirs`（请确认路径存在）：

```bash
export REPO="/Users/liuqiang1/AIproject/replenishment-skills"
# 手动编辑 openclaw.json 更稳妥；以下为检查项
test -d "$REPO/skills/wechat-supplier-collab" && echo "Skill 目录 OK"
```

## 3. 启动 wechaty-bridge（本仓库内）

```bash
cd /Users/liuqiang1/AIproject/replenishment-skills/wechaty-bridge
cp .env.example .env
# 编辑 OPENCLAW_*、SUPPLIERS_REGISTRY_PATH、PROCUREMENT_CONTACT_IDS
npm install
npm start
```

详见：`wechaty-bridge/README.md`

## 4. 配置 REST Channel

- 安装：`openclaw-rest-channel`（npm / 插件）
- 参考：`skills/wechat-supplier-collab/references/openclaw-rest-snippet.example.jsonc`
- `webhookUrl`: `http://127.0.0.1:8787/openclaw/outbound`（与 bridge `.env` 一致）
- Bridge 契约：`skills/wechat-supplier-collab/references/bridge-inbound-metadata.md`

## 5. 供应商群注册表

```bash
cd skills/wechat-supplier-collab
cp references/suppliers-registry.example.yaml suppliers-registry.yaml
# 编辑 roomTopic，与微信群名完全一致
```

## 6. 环境变量（可选）

```bash
export WECHAT_SUPPLIER_SKILL_HOME="/Users/liuqiang1/AIproject/replenishment-skills/skills/wechat-supplier-collab"
export REPLENISHMENT_SKILLS_HOME="/Users/liuqiang1/AIproject/replenishment-skills"
```

## 7. 验证

```bash
openclaw skills list | grep wechat-supplier
openclaw channels status --probe
# bridge 跑通后：openclaw logs --follow
```

## 8. POC

在采控会话发送：**「执行微信供应商 POC 健康检查」** → 触发 Skill §5.6 `health-check`。
