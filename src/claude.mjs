import { mkdirSync } from "node:fs";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  ADMIN_WECHAT_IDS,
  ALLOW_NETWORK,
  PROJECT_ROOT,
  isAdmin,
} from "./config.mjs";
import { requestApproval } from "./approvals.mjs";
import { classifyToolUse } from "./sandbox.mjs";

mkdirSync(PROJECT_ROOT, { recursive: true });

const userSessions = new Map();

const SYSTEM_GUARDRAILS = `你是通过微信接入的编程助手。
硬性规则：
1. 只能在项目目录内读写和执行命令，项目根目录是: ${PROJECT_ROOT}
2. 不要尝试访问项目外的路径、环境变量文件（.env）、密钥或用户主目录
3. 需要删除文件、安装依赖、访问网络前，应说明原因；系统会对越权操作向管理员发起确认
4. 回复简洁，适合微信阅读`;

function buildCanUseTool(requesterId) {
  return async (toolName, input, meta) => {
    if (!ALLOW_NETWORK && (toolName === "WebFetch" || toolName === "WebSearch")) {
      return { behavior: "deny", message: "网络工具已禁用（设置 ALLOW_NETWORK=true 可开启，仍需审批）" };
    }

    const { decision, reason, detail } = classifyToolUse(toolName, input);

    if (decision === "allow") {
      return { behavior: "allow" };
    }

    if (decision === "deny") {
      return { behavior: "deny", message: reason || "操作被拒绝" };
    }

    if (!ADMIN_WECHAT_IDS.length) {
      return {
        behavior: "deny",
        message: "该操作需管理员确认，但未配置 ADMIN_WECHAT_IDS",
      };
    }

    const admins = ADMIN_WECHAT_IDS;
    const result = await requestApproval({
      toolName,
      input,
      requesterId,
      title: meta.title || reason,
      description: detail || meta.description || meta.decisionReason,
      adminIds: admins,
    });

    if (result.behavior === "allow") return { behavior: "allow" };
    return {
      behavior: "deny",
      message: result.message || "操作未获批准",
      interrupt: false,
    };
  };
}

export async function askClaude(userText, userId) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error("请设置 ANTHROPIC_API_KEY（见 .env.example）");
  }

  const existingSessionId = userId ? userSessions.get(userId) : undefined;
  const model = process.env.CLAUDE_MODEL || "sonnet";

  const disallowedTools = ["AskUserQuestion"];
  if (!ALLOW_NETWORK) {
    disallowedTools.push("WebFetch", "WebSearch");
  }

  const options = {
    model,
    permissionMode: "default",
    baseTools: [{ preset: "default" }],
    disallowedTools,
    cwd: PROJECT_ROOT,
    env: {
      ...process.env,
      HOME: PROJECT_ROOT,
    },
    abortController: new AbortController(),
    canUseTool: buildCanUseTool(userId),
    systemPrompt: SYSTEM_GUARDRAILS,
  };

  if (existingSessionId) {
    options.resume = existingSessionId;
  }

  const wrappedText = isAdmin(userId)
    ? userText
    : `[用户消息]\n${userText}\n\n（当前为受限模式：仅项目目录 ${PROJECT_ROOT}）`;

  const prompt = existingSessionId
    ? wrappedText
    : (async function* () {
        yield {
          type: "user",
          session_id: "",
          parent_tool_use_id: null,
          message: { role: "user", content: wrappedText },
        };
      })();

  let result = "";
  for await (const msg of query({ prompt, options })) {
    if (msg.type === "result") {
      result = msg.result ?? "";
      if (userId && msg.session_id) {
        userSessions.set(userId, msg.session_id);
      }
    }
  }

  return result || "（Claude 无文本回复）";
}
