import { WechatyBuilder } from 'wechaty';
import { config } from './config.js';
import { shouldProcess } from './dedupe.js';
import { logger } from './logger.js';
import { postInbound } from './openclaw.js';
import {
  buildProcurementDirectPayload,
  buildSupplierGroupPayload,
} from './payload.js';
import { findSupplierByRoomTopic, loadRegistry } from './registry.js';

export function createBot() {
  const bot = WechatyBuilder.build({
    name: 'replenishment-wechaty-bridge',
    puppet: config.wechatyPuppet,
  });

  bot.on('login', (user) => {
    logger.info('wechaty login', { user: user.name() });
    loadRegistry();
  });

  bot.on('logout', (user) => {
    logger.warn('wechaty logout', { user: user?.name() });
  });

  bot.on('error', (err) => {
    logger.error('wechaty error', { error: String(err) });
  });

  bot.on('message', async (message) => {
    try {
      if (message.self()) return;

      const room = message.room();
      if (room) {
        await handleRoomMessage(bot, room, message);
      } else {
        await handleDirectMessage(message);
      }
    } catch (err) {
      logger.error('message handler failed', { error: String(err) });
    }
  });

  return bot;
}

async function handleRoomMessage(bot, room, message) {
  const roomTopic = await room.topic();
  const supplier = findSupplierByRoomTopic(roomTopic);
  if (!supplier) {
    logger.debug('room not in registry, skip', { roomTopic });
    return;
  }

  const listenMode = supplier.listenMode || 'at_me_only';
  const mentionedBot = await message.mentionSelf();
  const text = message.text();

  if (!text?.trim()) return;

  if (listenMode === 'at_me_only' && !mentionedBot) {
    return;
  }

  if (listenMode !== 'archive_only' && listenMode !== 'at_me_only') {
    logger.warn('unknown listenMode, treat as at_me_only', { listenMode, roomTopic });
    if (!mentionedBot) return;
  }

  const inboundMessageId = message.id;
  if (!shouldProcess(inboundMessageId, config.dedupeTtlMs)) {
    logger.debug('duplicate message skipped', { inboundMessageId });
    return;
  }

  const talker = await message.talker();
  const senderId = talker?.id || 'unknown';
  const senderName = talker?.name() || senderId;
  const roomId = room.id;

  const payload = buildSupplierGroupPayload({
    senderId,
    senderName,
    text,
    supplier,
    roomTopic,
    roomId,
    mentionedBot,
    listenMode,
    inboundMessageId: message.id,
  });

  await postInbound(payload);
}

async function handleDirectMessage(message) {
  const contact = await message.talker();
  const contactId = contact?.id;
  if (!contactId) return;

  const allow = config.procurementContactIds;
  if (allow.length > 0 && !allow.includes(contactId)) {
    logger.debug('direct message from non-procurement contact, skip', { contactId });
    return;
  }

  const text = message.text();
  if (!text?.trim()) return;

  const inboundMessageId = message.id;
  if (!shouldProcess(inboundMessageId, config.dedupeTtlMs)) return;

  const payload = buildProcurementDirectPayload({
    contactId,
    senderName: contact.name(),
    text,
    inboundMessageId: message.id,
  });
  await postInbound(payload);
}

export async function sendToRoom(bot, roomTopic, text, mention = []) {
  const room = await bot.Room.find({ topic: roomTopic });
  if (!room) {
    throw new Error(`room not found for topic: ${roomTopic}`);
  }

  if (mention?.length > 0) {
    const contacts = [];
    for (const name of mention) {
      const c = await room.find({ name });
      if (c) contacts.push(c);
    }
    if (contacts.length > 0) {
      await room.say(text, ...contacts);
      return;
    }
  }

  await room.say(text);
}
