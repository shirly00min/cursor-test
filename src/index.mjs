#!/usr/bin/env node
/**
 * Claude ↔ 微信（腾讯官方 iLink Bot API）
 *
 * npm start          # 长轮询 + Claude 自动回复
 * npm run login      # 强制重新扫码
 * node src/index.mjs pair AB12CD  # 批准配对码
 */

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
try {
  require("dotenv").config();
} catch {
  /* optional */
}

const args = process.argv.slice(2);
const forceLogin = args.includes("--login");
const pairIdx = args.indexOf("pair");

if (pairIdx !== -1) {
  const { approvePairing, listPaired } = await import("./pairing.mjs");
  const code = args[pairIdx + 1];
  if (!code) {
    console.error("用法: npm start -- pair <配对码>");
    process.exit(1);
  }
  const result = approvePairing(code);
  if (result.ok) {
    console.log(`✅ 已授权用户: ${result.userId}`);
    console.log(`当前白名单: ${listPaired().join(", ") || "（空）"}`);
  } else {
    console.error(`❌ ${result.reason}`);
    process.exit(1);
  }
  process.exit(0);
}

const { loadSession, login, clearSession } = await import("./auth.mjs");
const { getUpdates, sendMessage, extractText } = await import("./messaging.mjs");
const { askClaude } = await import("./claude.mjs");
const { isAuthorized, issuePairingCode, REQUIRE_PAIRING } = await import("./pairing.mjs");

async function main() {
  let session = forceLogin ? null : loadSession();
  if (session) {
    console.log(`✅ 已加载微信会话（Bot: ${session.accountId}）`);
  } else {
    session = await login();
  }

  const { token, baseUrl } = session;
  let running = true;

  process.on("SIGINT", () => {
    console.log("\n👋 退出中…");
    running = false;
  });

  console.log("\n🚀 长轮询已启动（Ctrl+C 退出）");
  if (REQUIRE_PAIRING) {
    console.log("🔒 配对模式已开启：未知用户会收到配对码，本地执行: npm start -- pair <码>\n");
  } else {
    console.log("⚠️  配对已关闭（REQUIRE_PAIRING=false）\n");
  }

  let buf = "";

  while (running) {
    try {
      const resp = await getUpdates(baseUrl, token, buf);
      if (resp.get_updates_buf) buf = resp.get_updates_buf;

      for (const msg of resp.msgs ?? []) {
        if (msg.message_type !== 1) continue;

        const from = msg.from_user_id;
        const text = extractText(msg);
        const ctx = msg.context_token;

        if (!text) continue;

        if (!isAuthorized(from)) {
          const code = issuePairingCode(from);
          await sendMessage(
            baseUrl,
            token,
            from,
            `🔐 首次使用需配对。\n配对码: ${code}\n\n请在运行本程序的终端执行:\nnpm start -- pair ${code}`,
            ctx,
          );
          console.log(`🔑 已向 ${from} 发送配对码 ${code}`);
          continue;
        }

        console.log(`\n📩 ${from}: ${text}`);

        try {
          process.stdout.write("   🤔 Claude…");
          const reply = await askClaude(text, from);
          process.stdout.write(" 完成\n");
          await sendMessage(baseUrl, token, from, reply, ctx);
          const preview = reply.length > 120 ? `${reply.slice(0, 120)}…` : reply;
          console.log(`   ✅ ${preview}`);
        } catch (err) {
          const errText = `处理失败: ${err.message}`;
          console.error(`   ❌ ${errText}`);
          await sendMessage(baseUrl, token, from, errText, ctx);
        }
      }
    } catch (err) {
      if (err.message?.includes("session timeout") || err.message?.includes("-14")) {
        console.error("\n❌ 微信会话过期，请执行: npm run login");
        clearSession();
        process.exit(1);
      }
      console.error(`⚠️ 轮询错误: ${err.message}，3 秒后重试…`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
