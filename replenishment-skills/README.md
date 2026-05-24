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

## OpenClaw 启用

1. 合并配置：见 `config/openclaw-replenishment-skills.jsonc`
2. 或阅读：`skills/wechat-supplier-collab/references/openclaw-rest-snippet.example.jsonc`（REST + Wechaty）
3. 验证：`openclaw skills list` 中含 `wechat-supplier-collab`

详细步骤：**`docs/INSTALL-wechat-supplier.md`**

## 新建 Skill

```bash
./scripts/create-skill.sh <skill-name>
```

（若本地已有该脚本，新 Skill 会出现在 `skills/<skill-name>/`。）
