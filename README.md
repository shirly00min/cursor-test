# Cowork / Cursor PM 全流程技能包

面向**产品经理兼研发**：把凌乱想法系统化为 **产品规划书 → PRD → 交互设计 → 可运行代码**。

技能符合 [Agent Skills](https://cursor.com/docs/skills) 开放标准，可在 **Cursor Cowork**、**Claude Code**（`.claude/skills`）、**Codex** 等环境中加载。

## 快速开始

1. 将本仓库作为你的项目根目录，或把 `.cursor/skills/product` 复制到任意项目的 `.cursor/skills/` 下。
2. 在 Agent 对话中输入 `/`，搜索技能名并运行。
3. 把你的碎片想法粘贴进对话，从 **`/pm-pipeline`** 开始（推荐）。

## 技能一览

| 命令 | 作用 |
|------|------|
| `/pm-pipeline` | **主编排**：分阶段推进全流程，每阶段可确认后继续 |
| `/ideation-to-plan` | 凌乱输入 → `docs/product/01-product-plan.md` |
| `/plan-to-prd` | 规划书 → `docs/product/02-prd.md` |
| `/prd-to-ux` | PRD → `docs/product/03-interaction-design.md` |
| `/ux-to-code` | 设计文档 → 仓库内可运行 MVP 代码 |

## 产出目录约定

```text
docs/product/
├── 00-input/                 # 原始输入摘要（可选）
├── 01-product-plan.md        # 产品规划书
├── 02-prd.md                 # 产品需求文档
├── 03-interaction-design.md  # 交互设计说明
└── 04-implementation/        # 技术方案与实现说明
```

## 安装位置

本仓库已在以下路径放置相同技能（内容一致）：

| 路径 | 适用 |
|------|------|
| `.cursor/skills/product/` | Cursor / Cowork 项目级 |
| `.claude/skills/product/` | Claude Code 项目级 |
| `.agents/skills/product/` | Agent Skills 标准目录 |

**全局安装（所有项目可用）：**

```bash
cp -r .cursor/skills/product ~/.cursor/skills/
cp -r .cursor/skills/product ~/.claude/skills/
```

## 推荐使用方式

### 一次性全流程

1. 运行 `/pm-pipeline`
2. 粘贴：想法、会议纪要、竞品笔记、约束（技术栈/时间）
3. 按提示在每阶段结束后回复「继续」或指出修改点

### 只做某一阶段

已有规划书时直接 `/plan-to-prd`；已有 PRD 时 `/prd-to-ux`，依此类推。

### 与 Figma / Notion 配合

- 需要高保真 UI：在交互阶段完成后，用 Figma 相关技能或 MCP 另开设计任务
- 需要任务看板：可将 PRD 中的 FR 同步到 Notion（使用 Notion 技能）

## 技能结构

```text
.cursor/skills/product/
├── pm-pipeline/           # 主编排（仅 / 显式调用）
├── ideation-to-plan/      # 阶段 1
├── plan-to-prd/           # 阶段 2
├── prd-to-ux/             # 阶段 3
├── ux-to-code/            # 阶段 4
└── */references/          # 各阶段模板与检查清单
```

## 自定义

- 修改各技能下 `references/*.md` 可调整你们团队的文档模板
- 在 `pm-pipeline/SKILL.md` 中可改默认产出路径 `docs/product/`
- 为 `ux-to-code` 所在项目添加 `.cursor/rules` 可覆盖默认技术栈

## 许可

按仓库根目录许可使用；技能内容可自由复制到个人或公司项目。
