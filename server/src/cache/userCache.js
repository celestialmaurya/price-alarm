"use strict";

const userStore = require("../storage/userStore");
const { createLogger } = require("../utils/logger");

const log = createLogger("userCache");

/**
 * Worker memory cache of the blob files.
 * The blob stays the source of truth: this is loaded on start and
 * reloaded whenever that one user edits something.
 */
const users = new Map(); // username -> user object

async function loadAll() {
  users.clear();
  const names = await userStore.listUsernames();
  for (const name of names) {
    const entry = await userStore.read(name);
    if (entry) users.set(name, entry.user);
  }
  log.info("cache loaded", { users: users.size });
  return users.size;
}

async function reload(username) {
  const entry = await userStore.read(username);
  if (!entry) {
    users.delete(username);
    return null;
  }
  users.set(username, entry.user);
  return entry.user;
}

function put(username, user) {
  users.set(username, user);
}

function get(username) {
  return users.get(username) || null;
}

function remove(username) {
  users.delete(username);
}

function all() {
  return Array.from(users.values());
}

module.exports = { loadAll, reload, put, get, remove, all };

