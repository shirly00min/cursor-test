import { isAbsolute, normalize, resolve } from "node:path";
import { PROJECT_ROOT } from "./config.mjs";

const DANGEROUS_BASH_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*f[a-zA-Z]*\s+)?\/\s*$/m,
  /\brm\s+-[a-zA-Z]*rf\s+\//,
  /\bsudo\b/,
  /\bchmod\s+777\b/,
  /\bcurl\b[^\n|]*\|\s*(ba)?sh\b/,
  /\bwget\b[^\n|]*\|\s*(ba)?sh\b/,
  /\bmkfs\b/,
  /\bdd\s+if=\/dev\/zero\b/,
  /\b>\s*\/etc\//,
  /\btee\s+.*\/etc\//,
];

const NETWORK_BASH_PATTERNS = [/\bcurl\b/, /\bwget\b/, /\bnc\s/, /\bssh\b/, /\bscp\b/];

export function resolveInProject(pathLike, cwd = PROJECT_ROOT) {
  if (!pathLike || typeof pathLike !== "string") return null;
  const trimmed = pathLike.trim().replace(/^['"]|['"]$/g, "");
  if (!trimmed || trimmed === "~") return null;
  const base = trimmed.startsWith("~")
    ? trimmed.replace(/^~/, process.env.HOME || "")
    : isAbsolute(trimmed)
      ? trimmed
      : resolve(cwd, trimmed);
  const abs = normalize(resolve(base));
  const root = normalize(resolve(PROJECT_ROOT));
  if (abs === root || abs.startsWith(`${root}/`)) return abs;
  return null;
}

export function isUnderProject(absPath) {
  if (!absPath) return false;
  const root = normalize(resolve(PROJECT_ROOT));
  const p = normalize(resolve(absPath));
  return p === root || p.startsWith(`${root}/`);
}

function collectPathsFromInput(toolName, input) {
  const paths = [];
  const keys = ["file_path", "path", "notebook_path", "directory", "dir"];
  for (const key of keys) {
    if (typeof input[key] === "string") paths.push(input[key]);
  }
  if (toolName === "Bash" && typeof input.command === "string") {
    const matches = input.command.matchAll(
      /(?:^|\s)(?:\/[\w./-]+|~\/[\w./-]+|\.\/[\w./-]+)/g,
    );
    for (const m of matches) paths.push(m[0].trim());
  }
  return paths;
}

/**
 * @returns {'allow' | 'deny' | 'ask', reason?: string, detail?: string}
 */
export function classifyToolUse(toolName, input) {
  if (toolName === "WebFetch" || toolName === "WebSearch") {
    return { decision: "ask", reason: "网络访问", detail: `${toolName} 需要管理员确认` };
  }

  const paths = collectPathsFromInput(toolName, input);

  if (toolName === "Bash" && typeof input.command === "string") {
    const cmd = input.command;
    for (const re of DANGEROUS_BASH_PATTERNS) {
      if (re.test(cmd)) {
        return { decision: "deny", reason: "危险命令已拒绝", detail: cmd.slice(0, 200) };
      }
    }
    for (const re of NETWORK_BASH_PATTERNS) {
      if (re.test(cmd)) {
        return { decision: "ask", reason: "Bash 含网络/远程操作", detail: cmd.slice(0, 200) };
      }
    }
  }

  if (["Read", "Edit", "Write", "MultiEdit", "Glob", "Grep", "NotebookEdit"].includes(toolName)) {
    for (const p of paths) {
      if (!resolveInProject(p)) {
        return {
          decision: "ask",
          reason: "访问项目目录外的路径",
          detail: `${toolName}: ${p}`,
        };
      }
    }
    return { decision: "allow" };
  }

  if (toolName === "Bash") {
    for (const p of paths) {
      if (p && !resolveInProject(p)) {
        return {
          decision: "ask",
          reason: "Bash 涉及项目外路径",
          detail: p,
        };
      }
    }
    return { decision: "allow" };
  }

  if (["Task", "Agent", "Skill", "TodoWrite"].includes(toolName)) {
    return { decision: "ask", reason: `敏感工具 ${toolName}`, detail: JSON.stringify(input).slice(0, 120) };
  }

  return { decision: "allow" };
}
