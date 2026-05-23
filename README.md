# Claude 链接微信 — 官方方案参考实现

基于**腾讯微信 ClawBot / iLink Bot API**（`https://ilinkai.weixin.qq.com`）的 Claude 桥接器，走官方 HTTP 协议，非逆向、非 Hook。

## 三种官方/半官方接入路径

| 方案 | 适用场景 | 命令/入口 |
|------|----------|-----------|
| **A. 腾讯 OpenClaw 插件（最官方）** | 已用 OpenClaw 网关 | `npx @tencent-weixin/openclaw-weixin-cli install` |
| **B. Claude Code Channel 插件** | 在终端里用 Claude Code 收发明信 | `claude plugin install weixin@m1heng-plugins` + Channels |
| **C. 本仓库（独立桥接）** | 微信里直接对话 Claude Agent（带工具） | `npm install && npm start` |

本仓库实现的是 **方案 C**：逻辑与社区项目 [cc-weixin](https://github.com/hao-ji-xing/cc-weixin) 同类，核心约 300 行，便于二次开发。

## 架构

```
微信用户 ──DM──→ ilinkai.weixin.qq.com
                      ↑ HTTP 长轮询 getUpdates
              本桥接 (src/)
                      ↓ Claude Agent SDK
              Claude（Bash / 读写文件 / 搜索等）
```

## 前置条件

1. **微信客户端**（需支持 ClawBot / iLink Bot）  
   - iOS 微信 8.0.70+  
   - Android 微信 8.0.69+  
   - macOS 微信 4.1.8.67+  

2. **Node.js** ≥ 20  

3. **Anthropic API Key**（[控制台](https://console.anthropic.com/) 申请）

## 快速开始

```bash
git clone <本仓库>
cd claude-weixin-official
npm install
cp .env.example .env
# 编辑 .env，填入 ANTHROPIC_API_KEY

npm run login   # 首次：微信扫码授权
npm start       # 启动长轮询
```

向 Bot 发微信消息后，终端会调用 Claude 并自动回复。

### 配对（默认开启）

未知用户首次私聊会收到 6 位配对码。在运行桥的机器上执行：

```bash
npm start -- pair AB12CD
```

批准后才处理该用户消息。关闭配对：`.env` 中设置 `REQUIRE_PAIRING=false`。

## 环境变量

见 [.env.example](.env.example)。

## 协议说明

iLink API 要点（回复必须带 `context_token`）见 [docs/ILINK-API.md](docs/ILINK-API.md)。

## 相关链接

- OpenClaw 文档: https://docs.openclaw.ai  
- 腾讯 npm 插件: `@tencent-weixin/openclaw-weixin`  
- Claude Agent SDK: `@anthropic-ai/claude-agent-sdk`  
- Claude Code 微信 Channel: [m1heng/claude-plugin-weixin](https://github.com/m1heng/claude-plugin-weixin)  

## 免责声明

- iLink / ClawBot 为腾讯官方通道，具体开放范围与条款以腾讯为准。  
- 本仓库为学习与个人使用示例，与 Anthropic、腾讯无隶属关系。  

## License

MIT
