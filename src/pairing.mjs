import crypto from "node:crypto";
import fs from "node:fs";
import {
  ALLOWED_WECHAT_IDS,
  DATA_DIR,
  PAIRING_FILE,
  REQUIRE_PAIRING,
  isWechatIdAllowed,
} from "./config.mjs";

function loadPaired() {
  if (!fs.existsSync(PAIRING_FILE)) return new Map();
  const raw = JSON.parse(fs.readFileSync(PAIRING_FILE, "utf-8"));
  return new Map(Object.entries(raw.paired ?? {}));
}

function savePaired(paired, pending) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    PAIRING_FILE,
    JSON.stringify(
      {
        paired: Object.fromEntries(paired),
        pending: Object.fromEntries(pending),
      },
      null,
      2,
    ),
    "utf-8",
  );
  try {
    fs.chmodSync(PAIRING_FILE, 0o600);
  } catch {
    /* ignore */
  }
}

const pairedUsers = loadPaired();
const pendingCodes = new Map(
  fs.existsSync(PAIRING_FILE)
    ? Object.entries(JSON.parse(fs.readFileSync(PAIRING_FILE, "utf-8")).pending ?? {})
    : [],
);

function persist() {
  savePaired(pairedUsers, pendingCodes);
}

export function isAuthorized(userId) {
  if (!isWechatIdAllowed(userId)) return false;
  if (!REQUIRE_PAIRING) return true;
  return pairedUsers.has(userId);
}

export function issuePairingCode(userId) {
  const code = crypto.randomBytes(3).toString("hex").toUpperCase();
  pendingCodes.set(code, { userId, createdAt: Date.now() });
  persist();
  return code;
}

export function approvePairing(code) {
  const upper = code.trim().toUpperCase();
  const entry = pendingCodes.get(upper);
  if (!entry) return { ok: false, reason: "配对码无效或已过期" };
  if (!isWechatIdAllowed(entry.userId) && ALLOWED_WECHAT_IDS.length) {
    return { ok: false, reason: "该用户不在 ALLOWED_WECHAT_IDS 白名单中" };
  }
  pendingCodes.delete(upper);
  pairedUsers.set(entry.userId, { pairedAt: new Date().toISOString() });
  persist();
  return { ok: true, userId: entry.userId };
}

export function listPaired() {
  return [...pairedUsers.keys()];
}

export function revokeUser(idPrefix) {
  const needle = idPrefix.toLowerCase();
  let n = 0;
  for (const id of [...pairedUsers.keys()]) {
    if (id.toLowerCase().includes(needle)) {
      pairedUsers.delete(id);
      n += 1;
    }
  }
  if (n) persist();
  return n;
}
