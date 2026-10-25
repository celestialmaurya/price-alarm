"use strict";

const config = require("../config");

/**
 * The only thing that ever travels to a device.
 * No tone, no wallpaper, no quote stream - the device picks its own media.
 * All values are strings: FCM data payloads carry strings only.
 */
function buildAlarmPayload(alarm, firedAt) {
  return {
    type: "price_alarm",
    alarmId: alarm.id,
    instrument: alarm.instrument,
    level: String(alarm.price),
    direction: alarm.direction,
    mode: alarm.repeat ? "repeat" : "once",
    firedAt: new Date(firedAt).toISOString(),
  };
}

function buildMessage(token, data) {
  return {
    token,
    data,
    android: {
      priority: "high",
      ttl: config.push.ttlSeconds * 1000,
      directBootOk: true,
    },
  };
}

module.exports = { buildAlarmPayload, buildMessage };

