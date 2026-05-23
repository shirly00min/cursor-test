import crypto from "node:crypto";
import { APPROVAL_TIMEOUT_MS } from "./config.mjs";
import { getWechatBridge } from "./runtime-context.mjs";

/** @type {Map<string, { id, toolName, input, requesterId, title, description, createdAt, resolvers }>} */
const pending = new Map();

function shortId() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

export function listPendingApprovals() {
  return [...pending.values()].map((p) => ({
    id: p.id,
    toolName: p.toolName,
    requesterId: p.requesterId,
    title: p.title,
    createdAt: p.createdAt,
  }));
}

export function resolveApproval(id, approved) {
  const key = id.trim().toUpperCase();
  const entry = pending.get(key);
  if (!entry) return { ok: false, reason: "审批单不存在或已过期" };
  pending.delete(key);
  const result = approved
    ? { behavior: "allow" }
    : { behavior: "deny", message: "管理员已拒绝该操作" };
  for (const resolve of entry.resolvers) {
    resolve(result);
  }
  return { ok: true, entry };
}

export async function requestApproval({ toolName, input, requesterId, title, description, adminIds }) {
  const id = shortId();
  const bridge = getWechatBridge();
  if (!bridge) {
    return { behavior: "deny", message: "审批通道未就绪" };
  }

  const promise = new Promise((resolve) => {
    const entry = {
      id,
      toolName,
      input,
      requesterId,
      title: title || toolName,
      description: description || "",
      createdAt: new Date().toISOString(),
      resolvers: [resolve],
    };
    pending.set(id, entry);

    const timer = setTimeout(() => {
      if (!pending.has(id)) return;
      pending.delete(id);
      resolve({ behavior: "deny", message: "审批超时，操作已取消" });
    }, APPROVAL_TIMEOUT_MS);

    const wrappedResolve = (result) => {
      clearTimeout(timer);
      resolve(result);
    };
    entry.resolvers = [wrappedResolve];
  });

  const lines = [
    "⚠️ 需要您确认的操作",
    `审批号: ${id}`,
    `发起人: ${requesterId}`,
    `工具: ${toolName}`,
    title ? `说明: ${title}` : "",
    description ? `详情: ${description}` : "",
    "",
    `同意: ${bridge.prefix}允许 ${id}`,
    `拒绝: ${bridge.prefix}拒绝 ${id}`,
  ].filter(Boolean);

  for (const adminId of adminIds) {
    await bridge.sendToUser(adminId, lines.join("\n"));
  }

  return promise;
}
