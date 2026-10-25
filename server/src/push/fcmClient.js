"use strict";

const admin = require("firebase-admin");
const config = require("../config");
const { createLogger } = require("../utils/logger");

const log = createLogger("fcmClient");

let app = null;
let initialised = false;

function parseServiceAccount(raw) {
  if (!raw) return null;
  const text = raw.trim().startsWith("{")
    ? raw
    : Buffer.from(raw, "base64").toString("utf8");
  return JSON.parse(text);
}

function init() {
  if (initialised) return app;
  initialised = true;
  if (!config.push.enabled) {
    log.warn("push disabled by config");
    return null;
  }
  try {
    const serviceAccount = parseServiceAccount(config.push.serviceAccountJson);
    app = admin.initializeApp(
      serviceAccount
        ? { credential: admin.credential.cert(serviceAccount) }
        : { credential: admin.credential.applicationDefault() }
    );
    log.info("firebase admin ready");
  } catch (err) {
    log.error("firebase admin init failed", { error: err.message });
    app = null;
  }
  return app;
}

function messaging() {
  if (!initialised) init();
  return app ? admin.messaging(app) : null;
}

module.exports = { init, messaging };

