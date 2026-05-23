# 微信 iLink Bot API 速查（官方通道）

接入域名：`https://ilinkai.weixin.qq.com`

## 鉴权头

```http
Content-Type: application/json
AuthorizationType: ilink_bot_token
X-WECHAT-UIN: <随机 uint32 的 base64>
Authorization: Bearer <bot_token>   # 登录后
```

## 登录

| 接口 | 方法 | 说明 |
|------|------|------|
| `/ilink/bot/get_bot_qrcode?bot_type=3` | GET | 获取二维码 |
| `/ilink/bot/get_qrcode_status?qrcode=...` | GET | 轮询：wait / scaned / expired / confirmed |

`confirmed` 时返回 `bot_token`、`baseurl`、`ilink_bot_id`。

## 收消息（长轮询）

```http
POST /ilink/bot/getupdates
{
  "get_updates_buf": "<游标，首次为空>",
  "base_info": { "channel_version": "1.0.2" }
}
```

- 服务端最长 hold ~35s  
- 响应中的 `get_updates_buf` 必须原样带回，否则会重复收消息  

## 发消息

```http
POST /ilink/bot/sendmessage
{
  "msg": {
    "to_user_id": "xxx@im.wechat",
    "message_type": 2,
    "message_state": 2,
    "context_token": "<来自入站消息，必填>",
    "item_list": [{ "type": 1, "text_item": { "text": "回复内容" } }]
  },
  "base_info": { "channel_version": "1.0.2" }
}
```

## 消息类型 item_list[].type

| type | 含义 |
|------|------|
| 1 | 文本 |
| 2 | 图片 |
| 3 | 语音 |
| 4 | 文件 |
| 5 | 视频 |

## 方案 A：腾讯 CLI 一键安装

```bash
npx @tencent-weixin/openclaw-weixin-cli install
```

会安装 `@tencent-weixin/openclaw-weixin` 并引导 `openclaw channels login`。

## 方案 B：Claude Code 插件

```bash
claude plugin marketplace add m1heng/claude-plugins
claude plugin install weixin@m1heng-plugins
/weixin:configure login
claude --dangerously-load-development-channels plugin:weixin@m1heng-plugins
```

消息在 Claude Code 终端会话中处理，通过 Channel 工具回发微信。
