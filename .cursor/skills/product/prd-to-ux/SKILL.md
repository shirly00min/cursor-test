---
name: prd-to-ux
description: 基于 PRD 产出交互设计说明：信息架构、用户流程、页面线框与状态设计。Use when 用户需要「交互稿」「原型说明」「UX 文档」「页面流程」，或 pm-pipeline 第 3 阶段。
metadata:
  phase: "3-ux"
  language: zh-CN
---

# PRD → 交互设计（prd-to-ux）

## 前置条件

- `docs/product/02-prd.md` 或等价 PRD
- 若无 PRD，先 `/plan-to-prd`

## 目标

产出 **`docs/product/03-interaction-design.md`**，研发与设计共用：足够实现 MVP 主路径，无需高保真视觉稿（除非用户要求）。

## 执行步骤

### 1. 从 PRD 提取

- 所有 P0 FR 及关键 P1
- 用户角色与场景
- 业务规则影响的分支（权限、状态）

### 2. 信息架构

- 站点地图 / 功能 IA（树状或 Mermaid）
- 导航模型：主导航、上下文返回、面包屑策略

### 3. 用户流程

- 每条核心场景一条 **序列流程**（Mermaid sequence 或 flowchart）
- 标注决策点、错误分支、权限拦截

### 4. 页面规格（文字线框）

对每个页面使用模板章节（见 `references/interaction-design-template.md`）：

- 页面 ID（如 `PG-001`）与名称
- 入口 / 出口
- 布局区块（顶栏、主区、侧栏）
- 字段与控件（类型、校验、默认值）
- 操作与反馈（toast、modal、inline error）
- 关联 FR ID

### 5. 全局规范

- 空态、加载态、错误态、无权限态
- 表单通用规则（提交、防重复）
- 响应式 / 端差异（若 PRD 有 NFR）

### 6. FR ↔ 页面映射表

| FR ID | 页面/流程 |
|-------|-----------|

### 7. 交付

- 写入 `docs/product/03-interaction-design.md`
- 提示：`/ux-to-code`；若需 Figma，说明可用 Figma MCP 另开设计任务

## 原则

- **可开发优先**：每个 P0 FR 至少映射到一个页面或明确「无 UI（API/后台）」
- 用 ASCII 或 Markdown 表格描述布局，避免仅形容词
- 不擅自增加 PRD 未列功能；若发现缺口，回写「建议补充 FR」列表

## 参考

- `references/interaction-design-template.md`
