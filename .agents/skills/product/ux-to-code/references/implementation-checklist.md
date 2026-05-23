# 实现阶段检查清单

## 实现前

- [ ] 已读 `02-prd.md` 全部 P0 FR
- [ ] 已读 `03-interaction-design.md` 主路径相关 PG-xxx
- [ ] 确认目标平台与技术栈
- [ ] 确认仓库根目录与包管理器（npm/pnpm/yarn）

## 实现中

- [ ] 目录结构与团队/仓库惯例一致
- [ ] 每个 P0 FR 有对应代码路径（见映射表）
- [ ] 表单校验与 PRD 业务规则一致
- [ ] 空态 / 加载 / 错误态已实现（至少主路径页面）
- [ ] 无硬编码密钥；敏感配置走环境变量
- [ ] 未实现项标记 `TODO(FR-xxx)` 而非静默省略

## 实现后

- [ ] `npm install`（或等价）成功
- [ ] `npm run dev` / `npm start` 可启动
- [ ] 主路径手动走通（登录/创建/列表等按产品定）
- [ ] `04-implementation/README.md` 含 FR 勾选表
- [ ] 根或子目录 README 更新启动说明

## FR 映射表示例

| FR ID | 模块/路径 | 状态 |
|-------|-----------|------|
| FR-001 | `src/pages/Login.tsx` | 完成 |
| FR-002 | `src/api/auth.ts` | 完成 |
| FR-003 | — | TODO |

## 常见技术默认（无指示时）

| 场景 | 默认 |
|------|------|
| 管理后台 / Web App | React 18 + TypeScript + Vite |
| 样式 | 项目已有则用已有；否则 Tailwind CSS |
| 状态 | 简单用 React state；复杂用 Zustand |
| API | 先 Mock 或 MSW；真实 API 待文档 |
| 测试 | 仅当用户要求或仓库已有测试框架时补充 |
