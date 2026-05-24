/**
 * Parse OUTBOUND_READY from OpenClaw outbound webhook text.
 */
export function parseOutboundReady(text) {
  if (!text || typeof text !== 'string') return null;

  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      if (obj?.type === 'OUTBOUND_READY') return normalizeOutboundReady(obj);
    } catch {
      /* fall through */
    }
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) {
    try {
      const obj = JSON.parse(fence[1].trim());
      if (obj?.type === 'OUTBOUND_READY') return normalizeOutboundReady(obj);
    } catch {
      /* fall through */
    }
  }

  const idx = trimmed.indexOf('{"type":"OUTBOUND_READY"');
  if (idx >= 0) {
    try {
      const slice = extractJsonObject(trimmed, idx);
      const obj = JSON.parse(slice);
      if (obj?.type === 'OUTBOUND_READY') return normalizeOutboundReady(obj);
    } catch {
      /* fall through */
    }
  }

  return null;
}

function extractJsonObject(str, start) {
  let depth = 0;
  for (let i = start; i < str.length; i++) {
    if (str[i] === '{') depth++;
    if (str[i] === '}') {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  throw new Error('unclosed JSON object');
}

function normalizeOutboundReady(obj) {
  const roomTopic = obj.roomTopic || conversationIdToTopic(obj.conversationId);
  if (!roomTopic || !obj.text) return null;
  return {
    roomTopic,
    text: String(obj.text),
    mention: Array.isArray(obj.mention) ? obj.mention : [],
    conversationId: obj.conversationId || `supplier:group:${roomTopic}`,
  };
}

function conversationIdToTopic(conversationId) {
  if (!conversationId || typeof conversationId !== 'string') return null;
  const prefix = 'supplier:group:';
  if (conversationId.startsWith(prefix)) {
    return conversationId.slice(prefix.length);
  }
  return null;
}
