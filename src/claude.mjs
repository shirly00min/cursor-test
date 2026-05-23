import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { query } from "@anthropic-ai/claude-agent-sdk";

const WORKSPACE = join(homedir(), ".claude-weixin-official", "workspace");
mkdirSync(WORKSPACE, { recursive: true });

const userSessions = new Map();

export async function askClaude(userText, userId) {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    throw new Error("请设置 ANTHROPIC_API_KEY（见 .env.example）");
  }

  const existingSessionId = userId ? userSessions.get(userId) : undefined;
  const model = process.env.CLAUDE_MODEL || "sonnet";

  const options = {
    model,
    baseTools: [{ preset: "default" }],
    deniedTools: ["AskUserQuestion"],
    cwd: WORKSPACE,
    env: process.env,
    abortController: new AbortController(),
  };

  if (existingSessionId) {
    options.resume = existingSessionId;
  }

  const prompt = existingSessionId
    ? userText
    : (async function* () {
        yield {
          type: "user",
          session_id: "",
          parent_tool_use_id: null,
          message: { role: "user", content: userText },
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
