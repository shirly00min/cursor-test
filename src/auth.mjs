import fs from "node:fs";
import qrcode from "qrcode-terminal";
import { apiGet } from "./api.mjs";
import { BOT_TYPE, DATA_DIR, DEFAULT_BASE_URL, TOKEN_FILE } from "./config.mjs";

export function loadSession() {
  if (!fs.existsSync(TOKEN_FILE)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
}

function saveSession(tokenData) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2), "utf-8");
  try {
    fs.chmodSync(TOKEN_FILE, 0o600);
  } catch {
    /* windows */
  }
}

export function clearSession() {
  try {
    fs.unlinkSync(TOKEN_FILE);
  } catch {
    /* ignore */
  }
}

export async function login() {
  console.log("🔐 微信官方 iLink 扫码登录…\n");

  const qrResp = await apiGet(
    DEFAULT_BASE_URL,
    `ilink/bot/get_bot_qrcode?bot_type=${BOT_TYPE}`,
  );
  let currentQrcode = qrResp.qrcode;

  console.log("📱 请用微信扫描下方二维码（需支持 ClawBot 的客户端版本）：\n");
  qrcode.generate(qrResp.qrcode_img_content, { small: true });

  const deadline = Date.now() + 5 * 60_000;
  let refreshCount = 0;

  while (Date.now() < deadline) {
    const status = await apiGet(
      DEFAULT_BASE_URL,
      `ilink/bot/get_qrcode_status?qrcode=${encodeURIComponent(currentQrcode)}`,
    );

    switch (status.status) {
      case "wait":
        process.stdout.write(".");
        break;
      case "scaned":
        console.log("\n👀 已扫码，请在手机上确认…");
        break;
      case "expired": {
        if (++refreshCount > 3) throw new Error("二维码多次过期，请重新运行 npm run login");
        console.log(`\n⏳ 二维码过期，刷新中 (${refreshCount}/3)…`);
        const newQr = await apiGet(
          DEFAULT_BASE_URL,
          `ilink/bot/get_bot_qrcode?bot_type=${BOT_TYPE}`,
        );
        currentQrcode = newQr.qrcode;
        qrcode.generate(newQr.qrcode_img_content, { small: true });
        break;
      }
      case "confirmed": {
        console.log("\n✅ 登录成功");
        const session = {
          token: status.bot_token,
          baseUrl: status.baseurl || DEFAULT_BASE_URL,
          accountId: status.ilink_bot_id,
          userId: status.ilink_user_id,
          savedAt: new Date().toISOString(),
        };
        saveSession(session);
        console.log(`   Bot ID: ${session.accountId}`);
        return session;
      }
      default:
        break;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  throw new Error("登录超时（5 分钟）");
}
