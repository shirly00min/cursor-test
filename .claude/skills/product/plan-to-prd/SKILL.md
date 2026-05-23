---
name: plan-to-prd
description: 基于产品规划书撰写可开发、可验收的产品需求文档（PRD）。Use when 用户已有规划书需要「写 PRD」「需求文档」「给研发看的需求」，或 pm-pipeline 第 2 阶段。
metadata:
  phase: "2-prd"
  language: zh-CN
---

# 规划书 → PRD（plan-to-prd）

## 前置条件

- 存在 `docs/product/01-product-plan.md`，或用户粘贴了等价内容
- 若缺失，先提示运行 `/ideation-to-plan` 或请用户提供规划书

## 目标

产出 **`docs/product/02-prd.md`**，使研发与测试能按 ID 实现与验收。

## 执行步骤

### 1. 读取规划书

- 提取 MVP 范围、用户场景、成功指标、假设 ID
- 建立 **追溯表**：规划书章节/假设 → 将生成的 FR/NFR

### 2. 需求分解

- **功能需求** `FR-xxx`：用户可感知的能力
- **非功能需求** `NFR-xxx`：性能、安全、可用性、兼容性等（按产品类型选取）
- **业务规则** `BR-xxx`：计算、权限、状态流转规则
- 每条需求：**优先级**（P0/P1/P2）、**描述**、**验收标准**、**依赖**

### 3. 撰写 PRD

套用模板：`references/prd-template.md`

**额外要求：**

- 用户故事格式：`作为 [角色]，我希望 [能力]，以便 [价值]`
- 验收标准优先用 **Given-When-Then** 或检查表
- 含 **范围外** 与 **发布说明**（若适用）
- 数据需求：核心实体字段级说明（表格），避免过早 API 设计

### 4. 一致性检查

- 每条 P0 FR 必须映射到规划书 MVP
- 规划书中的 Out of Scope 不得悄悄变成 FR
- 标注与假设 `A-xxx` 的关联

### 5. 交付

- 写入 `docs/product/02-prd.md`
- 输出 FR 统计（P0/P1/P2 数量）与建议研发顺序
- 提示：`/prd-to-ux` 或继续 pipeline

## 原则

- 一条 FR 只做一件事；过大则拆分
- 避免 UI 像素级描述（留给交互阶段），但要说清**信息内容与业务规则**
- 用「必须/应该/可以」区分强制性（RFC 2119 风格可选）

## 参考

- `references/prd-template.md`
