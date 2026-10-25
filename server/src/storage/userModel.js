"use strict";

const { badRequest } = require("../utils/errors");
const instruments = require("../config/instruments");

const DIRECTIONS = ["either", "rises_to", "falls_to"];
const STATES = ["armed", "awaiting_ack"];

const USERNAME_RE = /^[a-z0-9_-]{1,32}$/i;

function assertUsername(username) {
  if (!username || !USERNAME_RE.test(username)) {
    throw badRequest("invalid username");
  }
  return username.toLowerCase();
}

/** Shape stored in <username>.alarms. Nothing device-local ever lands here. */
function emptyUser(username) {
  return {
    username,
    deviceTokens: [],
    priceAlarms: [],
  };
}

function normaliseUser(raw, username) {
  const user = raw && typeof raw === "object" ? raw : {};
  return {
    username: user.username || username,
    deviceTokens: Array.isArray(user.deviceTokens)
      ? user.deviceTokens.filter((t) => typeof t === "string" && t.length > 0)
      : [],
    priceAlarms: Array.isArray(user.priceAlarms)
      ? user.priceAlarms.map(normaliseAlarm)
      : [],
  };
}

function normaliseAlarm(raw) {
  return {
    id: String(raw.id),
    instrument: String(raw.instrument),
    price: Number(raw.price),
    direction: DIRECTIONS.includes(raw.direction) ? raw.direction : "either",
    repeat: Boolean(raw.repeat),
    enabled: raw.enabled !== false,
    state: STATES.includes(raw.state) ? raw.state : "armed",
    lastFiredAt: raw.lastFiredAt || null,
  };
}

/** Validates an alarm coming from a device on PUT. */
function validateAlarmInput(body) {
  if (!body || typeof body !== "object") throw badRequest("missing body");

  const instrument = String(body.instrument || "");
  if (!instruments.isKnown(instrument)) {
    throw badRequest(`unknown instrument: ${instrument}`);
  }

  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) throw badRequest("invalid price");

  const direction = body.direction || "either";
  if (!DIRECTIONS.includes(direction)) throw badRequest("invalid direction");

  return {
    id: body.id ? String(body.id) : null,
    instrument,
    price,
    direction,
    repeat: Boolean(body.repeat),
    enabled: body.enabled !== false,
  };
}

module.exports = {
  DIRECTIONS,
  STATES,
  assertUsername,
  emptyUser,
  normaliseUser,
  normaliseAlarm,
  validateAlarmInput,
};

