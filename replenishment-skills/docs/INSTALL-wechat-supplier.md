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

## 3. 配置 REST Channel + Wechaty bridge

- 安装：`openclaw-rest-channel`（npm / 插件）
- 参考：`skills/wechat-supplier-collab/references/openclaw-rest-snippet.example.jsonc`
- Bridge 契约：`skills/wechat-supplier-collab/references/bridge-inbound-metadata.md`

## 4. 供应商群注册表

```bash
cd skills/wechat-supplier-collab
cp references/suppliers-registry.example.yaml suppliers-registry.yaml
# 编辑 roomTopic，与微信群名完全一致
```

## 5. 环境变量（可选）

```bash
export WECHAT_SUPPLIER_SKILL_HOME="/Users/liuqiang1/AIproject/replenishment-skills/skills/wechat-supplier-collab"
export REPLENISHMENT_SKILLS_HOME="/Users/liuqiang1/AIproject/replenishment-skills"
```

## 6. 验证

```bash
openclaw skills list | grep wechat-supplier
openclaw channels status --probe
# bridge 跑通后：openclaw logs --follow
```

## 7. POC

在采控会话发送：**「执行微信供应商 POC 健康检查」** → 触发 Skill §5.6 `health-check`。
