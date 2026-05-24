# replenishment-skills

采控 / 补货相关 **OpenClaw Skill 技能包**。每个子目录为独立 Skill（含 `SKILL.md`）。

## 组件

| 组件 | 目录 | 说明 |
|------|------|------|
| **wechat-supplier-collab** | `skills/wechat-supplier-collab/` | OpenClaw Skill（业务规则、待办、确认发群） |
| **wechaty-bridge** | `wechaty-bridge/` | Wechaty 桥（微信 ↔ REST 入站/出站） |

## 本机路径（示例）

```text
/Users/liuqiang1/AIproject/replenishment-skills/
```

## 首次启用 · 交互式配置（推荐）

在仓库根目录执行（分步问答，配置微信群与处理策略）：

```bash
cd /Users/liuqiang1/AIproject/replenishment-skills
npm install
npm run setup:wechat-supplier
```

## OpenClaw 启用

1. 合并向导生成的 `config/openclaw-wechat-supplier.generated.jsonc` 到 `~/.openclaw/openclaw.json`
2. 或手动合并：`config/openclaw-replenishment-skills.jsonc`
3. 验证：`openclaw skills list` 中含 `wechat-supplier-collab`

详细步骤：**`docs/INSTALL-wechat-supplier.md`**

## 新建 Skill

```bash
./scripts/create-skill.sh <skill-name>
```

（若本地已有该脚本，新 Skill 会出现在 `skills/<skill-name>/`。）
