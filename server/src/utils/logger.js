"use strict";

const config = require("../config");

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const current = LEVELS[config.logLevel] ?? LEVELS.info;

function emit(level, scope, message, extra) {
  if (LEVELS[level] > current) return;
  const line = {
    t: new Date().toISOString(),
    level,
    scope,
    msg: message,
  };
  if (extra !== undefined) line.data = extra;
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(line));
}

function createLogger(scope) {
  return {
    error: (m, e) => emit("error", scope, m, e),
    warn: (m, e) => emit("warn", scope, m, e),
    info: (m, e) => emit("info", scope, m, e),
    debug: (m, e) => emit("debug", scope, m, e),
  };
}

module.exports = { createLogger };

