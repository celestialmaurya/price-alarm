"use strict";

const { getBlockBlobClient, streamToString } = require("./blobClient");
const { normaliseUser } = require("./userModel");
const config = require("../config");
const { createKeyedLock } = require("../utils/keyedLock");
const { conflict, notFound } = require("../utils/errors");
const { createLogger } = require("../utils/logger");

const log = createLogger("userStore");
const withLock = createKeyedLock();

function blobName(username) {
  return `${username}${config.blob.fileExtension}`;
}

/** Returns { user, etag } or null when the file does not exist. */
async function read(username) {
  const client = getBlockBlobClient(blobName(username));
  try {
    const res = await client.download();
    const text = await streamToString(res.readableStreamBody);
    const parsed = JSON.parse(text);
    return { user: normaliseUser(parsed, username), etag: res.etag };
  } catch (err) {
    if (err.statusCode === 404 || err.code === "BlobNotFound") return null;
    throw err;
  }
}

async function exists(username) {
  const client = getBlockBlobClient(blobName(username));
  return client.exists();
}

/** Overwrites the file, but only if the etag still matches. */
async function write(username, user, etag) {
  const client = getBlockBlobClient(blobName(username));
  const body = JSON.stringify(user, null, 2);
  try {
    const res = await client.upload(body, Buffer.byteLength(body), {
      blobHTTPHeaders: { blobContentType: "application/json" },
      conditions: etag ? { ifMatch: etag } : undefined,
    });
    return res.etag;
  } catch (err) {
    if (err.statusCode === 412) throw conflict("file changed, retry");
    throw err;
  }
}

/**
 * Read -> mutate -> write with etag, retried on conflict.
 * `mutator(user)` may return a value which is passed back to the caller.
 * Returns { user, etag, result }.
 */
async function update(username, mutator, { attempts = 4 } = {}) {
  return withLock(username, async () => {
    let lastError = null;
    for (let i = 0; i < attempts; i += 1) {
      const current = await read(username);
      if (!current) throw notFound("user file not found");
      const draft = JSON.parse(JSON.stringify(current.user));
      const result = await mutator(draft);
      try {
        const etag = await write(username, draft, current.etag);
        return { user: draft, etag, result };
      } catch (err) {
        if (err.code !== "conflict") throw err;
        lastError = err;
        log.warn("etag conflict, retrying", { username, attempt: i + 1 });
      }
    }
    throw lastError;
  });
}

/** Every <name>.alarms file in the container. Used to warm the cache on boot. */
async function listUsernames() {
  const { getContainerClient } = require("./blobClient");
  const container = getContainerClient();
  const names = [];
  for await (const blob of container.listBlobsFlat()) {
    if (blob.name.endsWith(config.blob.fileExtension)) {
      names.push(blob.name.slice(0, -config.blob.fileExtension.length));
    }
  }
  return names;
}

module.exports = { read, write, update, exists, listUsernames, blobName };

