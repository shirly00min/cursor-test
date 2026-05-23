---
name: ideation-to-plan
description: 将凌乱、碎片化的产品想法整理为结构化的产品规划书。Use when 用户有 brainstorm、会议纪要、竞品笔记需要「理清思路」「写规划书」「产品方案」，或 pm-pipeline 的第 1 阶段。
metadata:
  phase: "1-plan"
  language: zh-CN
---

# 想法 → 产品规划书（ideation-to-plan）

## 目标

把非结构化输入转化为 **`docs/product/01-product-plan.md`**（路径可随用户调整），使后续 PRD 可直接引用章节与假设编号。

## 执行步骤

### 1. 摄入与结构化

- 列出用户提供的所有要点，**去重、归类**（问题 / 用户 / 方案 / 约束 / 想法池）
- 识别矛盾点，在文档开头增加 **《待对齐矛盾》**（若无则省略）
- 可选：将原始要点摘要写入 `docs/product/00-input/summary.md`

### 2. 澄清缺口

若以下任一项缺失且无法合理推断，先向用户提 **≤5 个**高价值问题，再继续撰写：

- 为谁解决什么问题
- 与现有产品/系统的关系
- MVP 必须包含什么

### 3. 撰写规划书

读取并套用模板：`references/product-plan-template.md`

**必须包含：**

- 执行摘要（半页内）
- 背景与机会
- 用户与场景（含 1～2 个用户故事摘要）
- 产品愿景与原则（3～5 条）
- 方案概述（能力地图，非实现细节）
- MVP 范围 / Out of Scope
- 成功指标
- 里程碑（不估日历工期，用阶段：Discovery → MVP → V1）
- 风险与假设（假设需可验证）
- 开放问题

### 4. 自检

对照 `pm-pipeline/references/pipeline-overview.md` 中「01 产品规划书」检查项。

### 5. 交付

- 写入 `docs/product/01-product-plan.md`
- 用要点列表向用户总结，并提示下一步：`/plan-to-prd` 或 `/pm-pipeline` 继续

## 原则

- **不编造**市场数据；需要数据处标注「待调研」
- 方案层写 **What & Why**，技术 How 留给后续阶段
- 保持假设编号：`A-001`, `A-002`… 供 PRD 追溯

## 参考

- `references/product-plan-template.md`
