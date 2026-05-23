#!/usr/bin/env node
/**
 * Claude ↔ 微信（腾讯官方 iLink Bot API）+ 安全控制
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
    console.log(`当前已配对: ${listPaired().join(", ") || "（空）"}`);
  } else {
    console.error(`❌ ${result.reason}`);
    process.exit(1);
  }
  process.exit(0);
}

import {
  ADMIN_WECHAT_IDS,
  ALLOWED_WECHAT_IDS,
  COMMAND_PREFIX,
  PROJECT_ROOT,
  isWechatIdAllowed,
} from "./config.mjs";
import { setWechatBridge } from "./runtime-context.mjs";
import { loadSession, login, clearSession } from "./auth.mjs";
import { getUpdates, sendMessage, extractText } from "./messaging.mjs";
import { askClaude } from "./claude.mjs";
import { isAuthorized, issuePairingCode, REQUIRE_PAIRING } from "./pairing.mjs";
import { handlePrefixCommand, isPrefixMessage } from "./commands.mjs";
import { checkRateLimit } from "./rate-limit.mjs";

const MAX_REPLY_LEN = 4000;

async function main() {
  let session = forceLogin ? null : loadSession();
  if (session) {
    console.log(`✅ 已加载微信会话（Bot: ${session.accountId}）`);
  } else {
    session = await login();
  }

  const { token, baseUrl } = session;
  let running = true;

  /** 最近一次会话的 context_token，用于向管理员推送审批 */
  const lastContextByUser = new Map();

  const sendToUser = async (userId, text, contextToken) => {
    const chunk =
      text.length > MAX_REPLY_LEN ? `${text.slice(0, MAX_REPLY_LEN - 20)}…(已截断)` : text;
    await sendMessage(baseUrl, token, userId, chunk, contextToken);
    if (contextToken) lastContextByUser.set(userId, contextToken);
  };

  setWechatBridge({
    prefix: COMMAND_PREFIX,
    sendToUser: async (userId, text) => {
      const ctx = lastContextByUser.get(userId) ?? "";
      const chunk =
        text.length > MAX_REPLY_LEN ? `${text.slice(0, MAX_REPLY_LEN - 20)}…(已截断)` : text;
      await sendMessage(baseUrl, token, userId, chunk, ctx);
    },
  });

  process.on("SIGINT", () => {
    console.log("\n👋 退出中…");
    running = false;
  });

  console.log("\n🚀 长轮询已启动（Ctrl+C 退出）");
  console.log(`📁 项目沙箱: ${PROJECT_ROOT}`);
  console.log(`🔤 指令前缀: ${COMMAND_PREFIX}（例如 ${COMMAND_PREFIX}帮助）`);
  if (ALLOWED_WECHAT_IDS.length) {
    console.log(`👤 微信白名单: ${ALLOWED_WECHAT_IDS.length} 个 ID`);
  } else {
    console.log("👤 微信白名单: 未配置（任意用户可尝试配对）");
  }
  if (ADMIN_WECHAT_IDS.length) {
    console.log(`🛡️  管理员: ${ADMIN_WECHAT_IDS.length} 个 ID（越权操作将通知管理员）`);
  } else {
    console.warn("⚠️  未配置 ADMIN_WECHAT_IDS，越权操作将被直接拒绝");
  }
  if (REQUIRE_PAIRING) {
    console.log("🔒 配对模式: 开启\n");
  } else {
    console.log("🔒 配对模式: 关闭\n");
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
        if (ctx) lastContextByUser.set(from, ctx);

        if (!isWechatIdAllowed(from)) {
          await sendToUser(
            from,
            "⛔ 您的微信 ID 不在允许列表中，无法使用此 Bot。\n请联系管理员将您的 ID 加入 ALLOWED_WECHAT_IDS。",
            ctx,
          );
          console.log(`🚫 拒绝未白名单用户: ${from}`);
          continue;
        }

        if (isPrefixMessage(text)) {
          const cmdResult = handlePrefixCommand(text, from);
          if (cmdResult.handled && cmdResult.reply) {
            await sendToUser(from, cmdResult.reply, ctx);
            console.log(`📋 指令 ${from}: ${text.split(/\s/)[0]}`);
          }
          continue;
        }

        if (!isAuthorized(from)) {
          const code = issuePairingCode(from);
          const adminHint = ADMIN_WECHAT_IDS.length
            ? `\n或让管理员发送: ${COMMAND_PREFIX}配对 ${code}`
            : "";
          await sendToUser(
            from,
            `🔐 首次使用需配对。\n配对码: ${code}\n\n终端: npm start -- pair ${code}${adminHint}`,
            ctx,
          );
          console.log(`🔑 配对码已发送给 ${from}: ${code}`);
          continue;
        }

        const rate = checkRateLimit(from);
        if (!rate.ok) {
          await sendToUser(from, `⏳ 发送过于频繁，请 ${rate.retryAfterSec} 秒后再试`, ctx);
          continue;
        }

        console.log(`\n📩 ${from}: ${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`);

        try {
          process.stdout.write("   🤔 Claude…");
          const reply = await askClaude(text, from);
          process.stdout.write(" 完成\n");
          await sendToUser(from, reply, ctx);
          const preview = reply.length > 120 ? `${reply.slice(0, 120)}…` : reply;
          console.log(`   ✅ ${preview}`);
        } catch (err) {
          const errText = `处理失败: ${err.message}`;
          console.error(`   ❌ ${errText}`);
          await sendToUser(from, errText, ctx);
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
