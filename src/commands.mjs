import {
  ADMIN_WECHAT_IDS,
  COMMAND_PREFIX,
  PROJECT_ROOT,
  isAdmin,
} from "./config.mjs";
import { listPendingApprovals, resolveApproval } from "./approvals.mjs";
import { approvePairing, listPaired, revokeUser } from "./pairing.mjs";

function stripPrefix(text) {
  const p = COMMAND_PREFIX;
  if (!text.startsWith(p)) return null;
  return text.slice(p.length).trim();
}

function usageHelp(prefix) {
  return [
    "📖 指令帮助",
    `${prefix}帮助 — 本说明`,
    `${prefix}状态 — 运行状态`,
    `${prefix}待审批 — 待确认操作（管理员）`,
    `${prefix}允许 <审批号> — 批准操作（管理员）`,
    `${prefix}拒绝 <审批号> — 拒绝操作（管理员）`,
    `${prefix}配对 <码> — 批准新用户配对（管理员）`,
    `${prefix}移除 <微信ID前缀> — 取消配对（管理员）`,
    "",
    `项目目录: ${PROJECT_ROOT}`,
    "超出项目目录或危险操作会推送给管理员确认。",
  ].join("\n");
}

/**
 * @returns {{ handled: boolean, reply?: string, silent?: boolean }}
 */
export function handlePrefixCommand(text, fromUserId) {
  const body = stripPrefix(text);
  if (body === null) return { handled: false };

  const [cmd, ...rest] = body.split(/\s+/);
  const arg = rest.join(" ").trim();
  const prefix = COMMAND_PREFIX;

  switch (cmd.toLowerCase()) {
    case "帮助":
    case "help":
      return { handled: true, reply: usageHelp(prefix) };

    case "状态":
    case "status": {
      const pending = listPendingApprovals();
      return {
        handled: true,
        reply: [
          "📊 状态",
          `项目目录: ${PROJECT_ROOT}`,
          `您的 ID: ${fromUserId}`,
          `管理员: ${ADMIN_WECHAT_IDS.length ? "是" : "否"}`,
          `待审批: ${pending.length} 条`,
          `已配对用户: ${listPaired().length} 人`,
        ].join("\n"),
      };
    }

    case "待审批":
    case "pending": {
      if (!isAdmin(fromUserId)) {
        return { handled: true, reply: "⛔ 仅管理员可查看待审批列表" };
      }
      const items = listPendingApprovals();
      if (!items.length) return { handled: true, reply: "✅ 当前无待审批操作" };
      const lines = items.map(
        (i) => `• ${i.id} | ${i.toolName} | ${i.requesterId.slice(0, 20)}…`,
      );
      return { handled: true, reply: `待审批 (${items.length}):\n${lines.join("\n")}` };
    }

    case "允许":
    case "approve": {
      if (!isAdmin(fromUserId)) {
        return { handled: true, reply: "⛔ 仅管理员可批准操作" };
      }
      if (!arg) return { handled: true, reply: `用法: ${prefix}允许 <审批号>` };
      const r = resolveApproval(arg, true);
      return {
        handled: true,
        reply: r.ok ? `✅ 已批准 ${arg.toUpperCase()}` : `❌ ${r.reason}`,
      };
    }

    case "拒绝":
    case "deny": {
      if (!isAdmin(fromUserId)) {
        return { handled: true, reply: "⛔ 仅管理员可拒绝操作" };
      }
      if (!arg) return { handled: true, reply: `用法: ${prefix}拒绝 <审批号>` };
      const r = resolveApproval(arg, false);
      return {
        handled: true,
        reply: r.ok ? `🚫 已拒绝 ${arg.toUpperCase()}` : `❌ ${r.reason}`,
      };
    }

    case "配对":
    case "pair": {
      if (!isAdmin(fromUserId)) {
        return { handled: true, reply: "⛔ 仅管理员可远程配对" };
      }
      if (!arg) return { handled: true, reply: `用法: ${prefix}配对 <配对码>` };
      const r = approvePairing(arg);
      return {
        handled: true,
        reply: r.ok ? `✅ 已配对用户 ${r.userId}` : `❌ ${r.reason}`,
      };
    }

    case "移除":
    case "revoke": {
      if (!isAdmin(fromUserId)) {
        return { handled: true, reply: "⛔ 仅管理员可移除用户" };
      }
      if (!arg) return { handled: true, reply: `用法: ${prefix}移除 <用户ID或前缀>` };
      const n = revokeUser(arg);
      return { handled: true, reply: n ? `✅ 已移除 ${n} 个用户` : "未找到匹配用户" };
    }

    default:
      return {
        handled: true,
        reply: `未知指令: ${cmd}\n发送 ${prefix}帮助 查看列表`,
      };
  }
}

export function isPrefixMessage(text) {
  return typeof text === "string" && text.startsWith(COMMAND_PREFIX);
}
