# wechaty-bridge

`replenishment-skills` 仓库内的 **Wechaty ↔ OpenClaw REST Channel** 桥接服务，配合 `skills/wechat-supplier-collab` 使用。

## 位置

```text
replenishment-skills/
  skills/wechat-supplier-collab/   # OpenClaw Skill（业务规则）
  wechaty-bridge/                  # 本服务（微信协议 + HTTP）
```

## 能力

- 监听注册表中供应商 **微信群**（`suppliers-registry.yaml`）
- `at_me_only`：仅 @ 采购小号时上报 OpenClaw
- `archive_only`：群消息静默归档（不要求 @）
- 采控 **私聊** 指令入站（`PROCUREMENT_CONTACT_IDS`）
- 接收 OpenClaw **出站 webhook**，仅当 `OUTBOUND_READY` JSON 时 `room.say`
- 入站去重、出站 HMAC 验签（可选）

## 快速开始

```bash
cd /Users/liuqiang1/AIproject/replenishment-skills/wechaty-bridge
cp .env.example .env
# 编辑 .env：OPENCLAW_INBOUND_API_KEY、OPENCLAW_WEBHOOK_SECRET、注册表路径

npm install
npm start
```

终端出现二维码时用 **采购小号** 扫码（wechat4u / 网页微信，POC 环境）。

## 与 OpenClaw 对接

1. 安装并配置 `openclaw-rest-channel`
2. `webhookUrl` 设为：`http://<bridge主机>:8787/openclaw/outbound`
3. `OPENCLAW_GATEWAY_URL` + `OPENCLAW_INBOUND_API_KEY` 与 Gateway 一致

详见：`../skills/wechat-supplier-collab/references/openclaw-rest-snippet.example.jsonc`

## 供应商注册表

默认读取（可在 `.env` 修改）：

```text
../skills/wechat-supplier-collab/references/suppliers-registry.example.yaml
```

生产请复制为 `suppliers-registry.yaml` 并修改 `SUPPLIERS_REGISTRY_PATH`。

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENCLAW_GATEWAY_URL` | Gateway 地址，如 `http://127.0.0.1:18789` |
| `OPENCLAW_INBOUND_API_KEY` | REST 入站 Bearer Token |
| `OPENCLAW_WEBHOOK_SECRET` | 出站验签密钥（与 openclaw.json 一致） |
| `WEBHOOK_PORT` | 默认 `8787` |
| `SUPPLIERS_REGISTRY_PATH` | 群白名单 YAML |
| `PROCUREMENT_CONTACT_IDS` | 采控微信号，逗号分隔 |
| `WECHATY_PUPPET` | 默认 `wechaty-puppet-wechat4u` |

## 部署建议

- **bridge + Wechaty**：Linux VPS 7×24
- **OpenClaw Gateway**：Mac 本机或内网；VPS 经 Tailscale 访问 `OPENCLAW_GATEWAY_URL`

## 风险

网页微信协议存在 **封号 / 掉线** 风险，仅建议 POC。见 Skill `health-check`。
