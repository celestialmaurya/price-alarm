"use strict";

const { EventEmitter } = require("node:events");

/**
 * Decouples the OANDA stream from the alarm engine.
 * Ticks are published here, consumed, and dropped. Nothing is stored.
 */
const bus = new EventEmitter();
bus.setMaxListeners(50);

/** @param {{instrument: string, mid: number, bid: number, ask: number, time: string}} tick */
function publishTick(tick) {
  bus.emit("tick", tick);
}

function onTick(handler) {
  bus.on("tick", handler);
  return () => bus.off("tick", handler);
}

function publishStatus(status) {
  bus.emit("status", status);
}

function onStatus(handler) {
  bus.on("status", handler);
  return () => bus.off("status", handler);
}

module.exports = { publishTick, onTick, publishStatus, onStatus };

