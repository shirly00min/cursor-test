# wechaty-bridge → openclaw-rest-channel 入站契约

## HTTP

```http
POST {GATEWAY}/rest/inbound
Authorization: Bearer {INBOUND_API_KEY}
Content-Type: application/json
```

## Body 示例（供应商群 · @ 触发）

```json
{
  "senderId": "wxid_supplier_user_001",
  "senderName": "张三-XX公司",
  "text": "@采购助手 对账单周三前发你们可以吗？",
  "conversationId": "supplier:group:XX供应商-对账群",
  "isGroup": true,
  "accountId": "default",
  "metadata": {
    "channel": "wechat",
    "source": "wechaty-bridge",
    "messageKind": "supplier_group",
    "supplierId": "SUP-001",
    "supplierName": "XX有限公司",
    "roomTopic": "XX供应商-对账群",
    "roomId": "12345678@chatroom",
    "senderWxId": "wxid_supplier_user_001",
    "senderDisplayName": "张三",
    "mentionedBot": true,
    "requiresReply": true,
    "approvalRequired": true,
    "listenMode": "at_me_only",
    "inboundMessageId": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2026-05-23T14:30:00+08:00"
  }
}
```

## Body 示例（采控指挥 · 确认发送）

```json
{
  "senderId": "wxid_procurement_001",
  "senderName": "采控-小刘",
  "text": "确认发送",
  "conversationId": "procurement:direct:wxid_procurement_001",
  "isGroup": false,
  "metadata": {
    "channel": "wechat",
    "source": "wechaty-bridge",
    "messageKind": "procurement_command",
    "command": "confirm_outbound",
    "targetConversationId": "supplier:group:XX供应商-对账群",
    "pendingDraftId": "draft-20260523-001"
  }
}
```

## bridge 伪代码（过滤）

```javascript
async function onRoomMessage(room, message) {
  const topic = await room.topic();
  const supplier = registry.findByRoomTopic(topic);
  if (!supplier) return;

  const mentioned = await message.mentionSelf();
  if (supplier.listenMode === 'at_me_only' && !mentioned) {
    if (supplier.listenMode !== 'archive_only') return;
  }

  if (supplier.listenMode === 'archive_only' || mentioned) {
    await postInbound(buildPayload(room, message, supplier, mentioned));
  }
}
```

## 出站（OpenClaw → bridge）

OpenClaw 在 `webhookUrl` POST（见 openclaw-rest-channel README）。bridge 应：

1. 校验 `X-OpenClaw-Signature`（若配置 secret）
2. 若 `text` 内含 JSON 块 `OUTBOUND_READY`，解析并 `room.say`
3. 否则 **不向供应商群发送**（仅可记日志或转采控私聊）

```json
{
  "channel": "rest",
  "accountId": "default",
  "conversationId": "supplier:group:XX供应商-对账群",
  "recipientId": "wxid_supplier_user_001",
  "text": "{\"type\":\"OUTBOUND_READY\",\"roomTopic\":\"XX供应商-对账群\",\"text\":\"收到，周五前完成对账。\"}",
  "messageId": "msg-uuid",
  "timestamp": "2026-05-23T10:05:00.000Z"
}
```

> 建议：Agent 确认后 OUTBOUND_READY 放在 `text` 整段 JSON，bridge 专用解析，避免与普通说明文字混淆。
