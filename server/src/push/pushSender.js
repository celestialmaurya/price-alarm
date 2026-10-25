"use strict";

const { messaging } = require("./fcmClient");
const { buildAlarmPayload, buildMessage } = require("./alarmPayload");
const { createLogger } = require("../utils/logger");

const log = createLogger("pushSender");

const DEAD_TOKEN_CODES = new Set([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

/**
 * One high priority data message per match, to that user's tokens only.
 * Returns the tokens FCM rejected as permanently dead so the caller can
 * prune them from the file.
 */
async function sendAlarm(user, alarm, firedAt) {
  const tokens = Array.from(new Set(user.deviceTokens || []));
  if (tokens.length === 0) {
    log.warn("no device tokens", { username: user.username });
    return { sent: 0, deadTokens: [] };
  }

  const fcm = messaging();
  const data = buildAlarmPayload(alarm, firedAt);
  if (!fcm) {
    log.warn("push skipped, messaging unavailable", { data });
    return { sent: 0, deadTokens: [] };
  }

  const deadTokens = [];
  let sent = 0;

  await Promise.all(
    tokens.map(async (token) => {
      try {
        await fcm.send(buildMessage(token, data));
        sent += 1;
      } catch (err) {
        if (DEAD_TOKEN_CODES.has(err.code)) {
          deadTokens.push(token);
          log.warn("dropping dead token", { username: user.username });
        } else {
          log.error("push failed", { error: err.message, code: err.code });
        }
      }
    })
  );

  log.info("alarm pushed", {
    username: user.username,
    alarmId: alarm.id,
    instrument: alarm.instrument,
    level: alarm.price,
    sent,
  });

  return { sent, deadTokens };
}

module.exports = { sendAlarm };

