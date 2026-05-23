import { homedir } from "node:os";
import { join } from "node:path";

/** 腾讯官方 iLink Bot 接入域名 */
export const DEFAULT_BASE_URL = "https://ilinkai.weixin.qq.com";

/** 与 @tencent-weixin/openclaw-weixin 一致的 bot_type */
export const BOT_TYPE = "3";

export const CHANNEL_VERSION = "1.0.2";

export const DATA_DIR = join(homedir(), ".claude-weixin-official");
export const TOKEN_FILE = join(DATA_DIR, "token.json");
export const PAIRING_FILE = join(DATA_DIR, "paired-users.json");

export const REQUIRE_PAIRING = process.env.REQUIRE_PAIRING !== "false";
