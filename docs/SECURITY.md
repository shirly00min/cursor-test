# 安全模型说明

## 分层访问控制

1. **微信 ID 白名单**（`ALLOWED_WECHAT_IDS`）  
   未在名单中的用户只会收到拒绝提示，不会进入配对或对话流程。

2. **配对**（`REQUIRE_PAIRING=true`）  
   白名单内用户首次使用仍需配对码；管理员可在微信发送 `/配对 <码>` 批准。

3. **速率限制**（`RATE_LIMIT_PER_MINUTE`）  
   防止刷屏与滥用 API。

## 项目沙箱

- `PROJECT_ROOT` 指定 Claude 的工作目录（`cwd`）。
- `Read` / `Edit` / `Write` / `Glob` / `Grep` 等工具访问的路径必须在 `PROJECT_ROOT` 下才会自动放行。
- `Bash` 中涉及项目外路径、网络命令（curl/wget/ssh 等）会进入审批。
- 明显危险命令（如 `rm -rf /`、`sudo`、管道执行远程脚本）直接拒绝。

## 越权确认（管理员）

当操作被判定为 `ask` 时：

1. 向所有 `ADMIN_WECHAT_IDS` 推送审批消息（含审批号）。
2. 管理员回复：
   - `/允许 <审批号>` — 放行本次工具调用
   - `/拒绝 <审批号>` — 拒绝
3. 超时（`APPROVAL_TIMEOUT_MS`）自动拒绝。

未配置管理员时，所有 `ask` 类操作直接拒绝。

## 前缀指令

默认前缀 `/`（可用 `COMMAND_PREFIX` 修改）：

| 指令 | 权限 | 说明 |
|------|------|------|
| `/帮助` | 所有人 | 帮助 |
| `/状态` | 所有人 | 运行状态 |
| `/待审批` | 管理员 | 列出待审批 |
| `/允许 <号>` | 管理员 | 批准操作 |
| `/拒绝 <号>` | 管理员 | 拒绝操作 |
| `/配对 <码>` | 管理员 | 批准新用户 |
| `/移除 <id>` | 管理员 | 取消已配对用户 |

## 建议配置

```env
PROJECT_ROOT=/your/repo
ALLOWED_WECHAT_IDS=only_you@im.wechat
ADMIN_WECHAT_IDS=only_you@im.wechat
REQUIRE_PAIRING=true
ALLOW_NETWORK=false
RATE_LIMIT_PER_MINUTE=12
```

## 局限

- Bash 命令解析为启发式规则，不能替代完整沙箱；敏感环境请配合容器/专用用户运行。
- 审批依赖微信消息送达，请确保管理员 ID 配置正确。
