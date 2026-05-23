import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** 腾讯官方 iLink Bot 接入域名 */
export const DEFAULT_BASE_URL = "https://ilinkai.weixin.qq.com";

export const BOT_TYPE = "3";
export const CHANNEL_VERSION = "1.0.2";

export const DATA_DIR = join(homedir(), ".claude-weixin-official");
export const TOKEN_FILE = join(DATA_DIR, "token.json");
export const PAIRING_FILE = join(DATA_DIR, "paired-users.json");

/** 项目沙箱根目录（Claude 默认只能在此范围内自动执行） */
export const PROJECT_ROOT = resolve(
  process.env.PROJECT_ROOT || process.cwd(),
);

const pkgRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

export const REQUIRE_PAIRING = process.env.REQUIRE_PAIRING !== "false";

/** 指令前缀，默认 / ，例如 /帮助 /允许 abc123 */
export const COMMAND_PREFIX = process.env.COMMAND_PREFIX || "/";

/** 允许使用 Bot 的微信用户 ID（逗号分隔，完整或 @im.wechat 后缀前前缀） */
export const ALLOWED_WECHAT_IDS = parseIdList(process.env.ALLOWED_WECHAT_IDS);

/** 管理员 ID：接收越权确认、可执行管理指令 */
export const ADMIN_WECHAT_IDS = parseIdList(process.env.ADMIN_WECHAT_IDS);

/** 越权操作等待管理员确认的毫秒数 */
export const APPROVAL_TIMEOUT_MS = Number(process.env.APPROVAL_TIMEOUT_MS || 300_000);

/** 是否允许 WebFetch / WebSearch（默认关闭，需确认或显式开启） */
export const ALLOW_NETWORK = process.env.ALLOW_NETWORK === "true";

/** 单用户每分钟最大消息数 */
export const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE || 12);

function parseIdList(raw) {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isIdInList(userId, list) {
  if (!list.length) return false;
  const normalized = userId.toLowerCase();
  return list.some((entry) => {
    const e = entry.toLowerCase();
    return normalized === e || normalized.startsWith(`${e}@`) || normalized.includes(e);
  });
}

/** 未配置 ALLOWED_WECHAT_IDS 时仅依赖配对；配置后必须在名单中 */
export function isWechatIdAllowed(userId) {
  if (!ALLOWED_WECHAT_IDS.length) return true;
  return isIdInList(userId, ALLOWED_WECHAT_IDS);
}

export function isAdmin(userId) {
  return isIdInList(userId, ADMIN_WECHAT_IDS);
}

export { pkgRoot };
