import crypto from 'node:crypto';
import { config } from './config.js';

export function buildSupplierGroupPayload({
  senderId,
  senderName,
  text,
  supplier,
  roomTopic,
  roomId,
  mentionedBot,
  listenMode,
  inboundMessageId,
}) {
  const msgId = inboundMessageId || crypto.randomUUID();

  return {
    senderId,
    senderName,
    text,
    conversationId: `supplier:group:${roomTopic}`,
    isGroup: true,
    accountId: config.openclaw.accountId,
    metadata: {
      channel: 'wechat',
      source: 'wechaty-bridge',
      messageKind: 'supplier_group',
      supplierId: supplier.supplierId,
      supplierName: supplier.supplierName,
      category: supplier.category,
      roomTopic,
      roomId,
      senderWxId: senderId,
      senderDisplayName: senderName,
      mentionedBot,
      requiresReply: mentionedBot && listenMode !== 'archive_only',
      approvalRequired: supplier.approvalRequired !== false,
      listenMode,
      inboundMessageId: msgId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function buildProcurementDirectPayload({
  contactId,
  senderName,
  text,
  inboundMessageId,
}) {
  const msgId = inboundMessageId || crypto.randomUUID();
  const isConfirm = /确认发送|同意发出|ok\s*send/i.test(text || '');

  return {
    senderId: contactId,
    senderName,
    text,
    conversationId: `procurement:direct:${contactId}`,
    isGroup: false,
    accountId: config.openclaw.accountId,
    metadata: {
      channel: 'wechat',
      source: 'wechaty-bridge',
      messageKind: 'procurement_command',
      ...(isConfirm ? { command: 'confirm_outbound' } : {}),
      inboundMessageId: msgId,
      timestamp: new Date().toISOString(),
    },
  };
}
