"use strict";

/**
 * Serialises async work per key (per username), so two requests never
 * race on the same blob.
 */
function createKeyedLock() {
  const chains = new Map();

  return function withLock(key, fn) {
    const previous = chains.get(key) || Promise.resolve();
    const result = previous.then(fn, fn);
    // keep the chain alive but do not leak rejections into the next waiter
    const settled = result.then(
      () => undefined,
      () => undefined
    );
    chains.set(key, settled);
    settled.then(() => {
      if (chains.get(key) === settled) chains.delete(key);
    });
    return result;
  };
}

module.exports = { createKeyedLock };


