const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

const level = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

export function log(levelName, message, extra) {
  if ((LEVELS[levelName] ?? 0) < level) return;
  const line = extra
    ? `${new Date().toISOString()} [${levelName}] ${message} ${JSON.stringify(extra)}`
    : `${new Date().toISOString()} [${levelName}] ${message}`;
  // eslint-disable-next-line no-console
  console.log(line);
}

export const logger = {
  debug: (msg, extra) => log('debug', msg, extra),
  info: (msg, extra) => log('info', msg, extra),
  warn: (msg, extra) => log('warn', msg, extra),
  error: (msg, extra) => log('error', msg, extra),
};
