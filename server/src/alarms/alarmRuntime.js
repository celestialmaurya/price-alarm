"use strict";

/**
 * Per-alarm volatile state that never reaches the blob:
 * last seen mid, whether the alarm is waiting to leave the level,
 * and how many un-acked reminders went out.
 */
const runtime = new Map(); // `${username}:${alarmId}` -> state

function key(username, alarmId) {
  return `${username}:${alarmId}`;
}

function get(username, alarmId) {
  const k = key(username, alarmId);
  let state = runtime.get(k);
  if (!state) {
    state = {
      previousMid: null,
      needsReset: false,
      firedDirection: null,
      reminders: 0,
    };
    runtime.set(k, state);
  }
  return state;
}

function reset(username, alarmId) {
  runtime.delete(key(username, alarmId));
}

function resetUser(username) {
  const prefix = `${username}:`;
  for (const k of runtime.keys()) {
    if (k.startsWith(prefix)) runtime.delete(k);
  }
}

function clear() {
  runtime.clear();
}

module.exports = { get, reset, resetUser, clear };

