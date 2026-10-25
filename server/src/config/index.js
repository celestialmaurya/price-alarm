"use strict";

/**
 * Single place where every tunable lives.
 * Nothing else in the code base reads process.env directly.
 *
 * Order of precedence: environment variable -> src/config/secrets.js -> default.
 * So you can hard code everything in secrets.js and still override any value
 * with an Azure app setting later.
 */

const secrets = require("./secrets");

/** env wins, then the hard coded file, then the fallback */
function setting(name, fallback = "") {
  const fromEnv = process.env[name];
  if (fromEnv !== undefined && fromEnv !== "") return fromEnv;
  const fromFile = secrets[name];
  if (fromFile !== undefined && fromFile !== "") return fromFile;
  return fallback;
}

const OANDA_ENVIRONMENT = setting("OANDA_ENVIRONMENT", "practice");

const streamHosts = {
  practice: "https://stream-fxpractice.oanda.com",
  live: "https://stream-fxtrade.oanda.com",
};

const restHosts = {
  practice: "https://api-fxpractice.oanda.com",
  live: "https://api-fxtrade.oanda.com",
};

/** The service account can be a JSON object, a JSON string or base64. */
function serviceAccountString() {
  const value =
    process.env.FIREBASE_SERVICE_ACCOUNT || secrets.FIREBASE_SERVICE_ACCOUNT;
  if (!value) return "";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
}

const config = {
  port: Number(process.env.PORT || 8080),

  // --- auth -------------------------------------------------------------
  // The sideloaded app sends this as `x-api-key`. Plus the username in the path.
  apiKey: setting("API_KEY"),

  // --- blob -------------------------------------------------------------
  blob: {
    connectionString: setting("AZURE_STORAGE_CONNECTION_STRING"),
    container: setting("ALARMS_CONTAINER", "alarms"),
    fileExtension: ".alarms",
  },

  // --- oanda ------------------------------------------------------------
  oanda: {
    token: setting("OANDA_API_TOKEN"),
    environment: OANDA_ENVIRONMENT,
    streamHost: streamHosts[OANDA_ENVIRONMENT] || streamHosts.practice,
    restHost: restHosts[OANDA_ENVIRONMENT] || restHosts.practice,
    accountId: setting("OANDA_ACCOUNT_ID"),
    // seconds without any line (incl. heartbeats) before we force a reconnect
    staleAfterSeconds: Number(setting("OANDA_STALE_SECONDS", "20")),
    reconnectMinMs: 1000,
    reconnectMaxMs: 30000,
  },

  // --- alarm rules ------------------------------------------------------
  alarms: {
    // after a ring the alarm is silent for this long
    quietWindowMs: Number(setting("QUIET_WINDOW_MS", String(2 * 60 * 1000))),
    // once-alarms waiting for an ack get exactly one reminder at the end of the window
    unackedReminders: 1,
  },

  // --- push -------------------------------------------------------------
  push: {
    ttlSeconds: 60,
    // service account JSON (raw or base64)
    serviceAccountJson: serviceAccountString(),
    enabled: process.env.PUSH_ENABLED !== "false",
  },

  // --- weekend shutdown -------------------------------------------------
  scheduler: {
    timeZone: setting("MARKET_TIME_ZONE", "UTC"),
    // 0 = Sunday ... 6 = Saturday
    offDays: setting("MARKET_OFF_DAYS", "0,6")
      .split(",")
      .map((d) => Number(String(d).trim()))
      .filter((d) => !Number.isNaN(d)),
    checkIntervalMs: 60 * 1000,
  },

  logLevel: setting("LOG_LEVEL", "info"),
};

module.exports = config;


