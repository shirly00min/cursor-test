---
name: ux-to-code
description: 根据 PRD 与交互设计实现可运行代码：项目骨架、MVP 主路径、README 与需求追溯。Use when 用户要「落地代码」「开始开发」「按文档实现」，或 pm-pipeline 第 4 阶段。
metadata:
  phase: "4-code"
  language: zh-CN
---

# 交互设计 → 可落地代码（ux-to-code）

## 前置条件

- `docs/product/02-prd.md` 与 `docs/product/03-interaction-design.md`
- 若缺失，先补全或请用户确认仅实现子集

## 目标

在仓库中实现 **MVP 主路径可运行代码**，并写入实现说明。

## 执行步骤

### 1. 技术方案（简版）

在 `docs/product/04-implementation/README.md` 记录：

- 技术栈选型及理由（对齐用户/仓库既有栈，**无栈时默认**：Web → TypeScript + React + Vite；API → Node；移动端需用户指定）
- 目录结构
- 环境变量清单
- **FR → 模块/文件** 映射表

读取检查清单：`references/implementation-checklist.md`

### 2. 实现顺序

1. 项目初始化（复用已有 monorepo 结构，勿重复造轮子）
2. 数据模型 / Mock / 本地存储（按 PRD 实体）
3. 路由与页面骨架（对齐 PG-xxx）
4. P0 FR 纵向切片（一条主路径打通）
5. 全局：错误处理、加载、空态（对齐交互 §4）
6. README：安装、启动、测试命令

### 3. 编码原则

- **最小可行**：先通主路径，P1 可留 `// TODO(FR-xxx)`
- 遵循仓库既有 lint、目录、命名约定；无仓库时采用常见社区惯例
- 关键逻辑处注释关联 ID：`// FR-001: 用户登录`
- 不引入与 MVP 无关的重型依赖

### 4. 验证

- 运行安装与启动命令，修复阻塞错误
- 对照 P0 FR 验收标准自检（在 README 或 IMPLEMENTATION 中勾选表）

### 5. 交付

- 代码提交到功能分支（若用户未指定则在当前分支工作）
- 更新 `docs/product/04-implementation/README.md`
- 向用户说明：如何启动、已完成 FR、已知限制、建议下一步

## 与用户确认（仅必要时）

以下情况先问 1 轮，不要长问卷：

- 目标平台不明（Web / iOS / Android / 小程序）
- 必须对接真实后端但无 API 文档
- 仓库已有强约束技术栈与默认冲突

## 参考

- `references/implementation-checklist.md`
