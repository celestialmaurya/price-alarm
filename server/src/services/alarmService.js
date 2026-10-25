"use strict";

const { randomUUID } = require("node:crypto");
const userStore = require("../storage/userStore");
const userCache = require("../cache/userCache");
const { validateAlarmInput } = require("../storage/userModel");
const { alarmEngine } = require("../alarms/alarmEngine");
const { oandaStream } = require("../pricing/oandaStream");
const { notFound } = require("../utils/errors");
const { createLogger } = require("../utils/logger");

const log = createLogger("alarmService");

/**
 * Everything the HTTP layer is allowed to do with a user file.
 * The file is the source of truth; the cache is refreshed after every write.
 */

async function requireUser(username) {
  const cached = userCache.get(username);
  if (cached) return cached;
  const user = await userCache.reload(username);
  if (!user) throw notFound("price alerts are not enabled for this user");
  return user;
}

async function userExists(username) {
  if (userCache.get(username)) return true;
  const exists = await userStore.exists(username);
  if (exists) await userCache.reload(username);
  return exists;
}

async function listAlarms(username) {
  const user = await requireUser(username);
  return user.priceAlarms;
}

async function upsertAlarm(username, body) {
  await requireUser(username);
  const input = validateAlarmInput(body);

  const { user, result } = await userStore.update(username, (draft) => {
    const existing = input.id
      ? draft.priceAlarms.find((a) => a.id === input.id)
      : null;

    if (existing) {
      const levelChanged =
        existing.price !== input.price ||
        existing.instrument !== input.instrument ||
        existing.direction !== input.direction;
      existing.instrument = input.instrument;
      existing.price = input.price;
      existing.direction = input.direction;
      existing.repeat = input.repeat;
      existing.enabled = input.enabled;
      if (levelChanged) {
        existing.state = "armed";
        existing.lastFiredAt = null;
      }
      return { alarm: existing, fresh: levelChanged };
    }

    const alarm = {
      id: input.id || randomUUID(),
      instrument: input.instrument,
      price: input.price,
      direction: input.direction,
      repeat: input.repeat,
      enabled: input.enabled,
      state: "armed",
      lastFiredAt: null,
    };
    draft.priceAlarms.push(alarm);
    return { alarm, fresh: true };
  });

  userCache.put(username, user);

  if (result.fresh) {
    // baseline = price right now, so an alarm created on the level stays silent
    alarmEngine.seedBaseline(
      username,
      result.alarm,
      oandaStream.getMid(result.alarm.instrument)
    );
  }

  log.info("alarm saved", { username, alarmId: result.alarm.id });
  return result.alarm;
}

async function deleteAlarm(username, alarmId) {
  await requireUser(username);
  const { user, result } = await userStore.update(username, (draft) => {
    const before = draft.priceAlarms.length;
    draft.priceAlarms = draft.priceAlarms.filter((a) => a.id !== alarmId);
    return { removed: before !== draft.priceAlarms.length };
  });
  userCache.put(username, user);
  alarmEngine.forget(username, alarmId);
  if (!result.removed) throw notFound("alarm not found");
  return true;
}

/** First device to ack wins: a once-alarm is deleted here. */
async function acknowledge(username, alarmId) {
  await requireUser(username);
  const { user, result } = await userStore.update(username, (draft) => {
    const alarm = draft.priceAlarms.find((a) => a.id === alarmId);
    if (!alarm) return { status: "gone" };
    if (!alarm.repeat) {
      draft.priceAlarms = draft.priceAlarms.filter((a) => a.id !== alarmId);
      return { status: "deleted" };
    }
    alarm.state = "armed";
    return { status: "armed" };
  });
  userCache.put(username, user);
  if (result.status === "deleted" || result.status === "gone") {
    alarmEngine.forget(username, alarmId);
  }
  log.info("alarm acked", { username, alarmId, status: result.status });
  return result.status;
}

async function addDevice(username, token) {
  await requireUser(username);
  const { user } = await userStore.update(username, (draft) => {
    if (!draft.deviceTokens.includes(token)) draft.deviceTokens.push(token);
  });
  userCache.put(username, user);
  return user.deviceTokens.length;
}

async function removeDevice(username, token) {
  await requireUser(username);
  const { user } = await userStore.update(username, (draft) => {
    draft.deviceTokens = draft.deviceTokens.filter((t) => t !== token);
  });
  userCache.put(username, user);
  return user.deviceTokens.length;
}

module.exports = {
  requireUser,
  userExists,
  listAlarms,
  upsertAlarm,
  deleteAlarm,
  acknowledge,
  addDevice,
  removeDevice,
};

