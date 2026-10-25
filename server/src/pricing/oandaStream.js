"use strict";

const config = require("../config");
const { midFromPriceMessage } = require("./midPrice");
const { resolveAccountId } = require("./oandaAccount");
const priceBus = require("./priceBus");
const instruments = require("../config/instruments");
const { createLogger } = require("../utils/logger");

const log = createLogger("oandaStream");

/**
 * Persistent OANDA pricing stream.
 * Ticks are turned into a mid price, pushed on the bus and dropped.
 * Nothing is stored, nothing is forwarded to devices.
 */
class OandaStream {
  constructor() {
    this.running = false;
    this.controller = null;
    this.backoffMs = config.oanda.reconnectMinMs;
    this.lastLineAt = 0;
    this.watchdog = null;
    this.lastMid = new Map(); // instrument -> mid (diagnostics only)
  }

  start() {
    if (this.running) return;
    if (!config.oanda.token) {
      log.error("missing OANDA_API_TOKEN, stream disabled");
      return;
    }
    this.running = true;
    log.info("stream starting", { environment: config.oanda.environment });
    this.#startWatchdog();
    this.#connectLoop();
    priceBus.publishStatus({ connected: false, running: true });
  }

  stop(reason = "stop requested") {
    if (!this.running) return;
    this.running = false;
    log.info("stream stopping", { reason });
    this.#stopWatchdog();
    if (this.controller) this.controller.abort();
    this.controller = null;
    priceBus.publishStatus({ connected: false, running: false });
  }

  isRunning() {
    return this.running;
  }

  /** Latest mid we saw for an instrument, used to seed new alarms. */
  getMid(instrument) {
    const value = this.lastMid.get(instrument);
    return Number.isFinite(value) ? value : null;
  }

  snapshot() {
    return {
      running: this.running,
      lastLineAt: this.lastLineAt ? new Date(this.lastLineAt).toISOString() : null,
      prices: Object.fromEntries(this.lastMid),
    };
  }

  #startWatchdog() {
    this.#stopWatchdog();
    this.watchdog = setInterval(() => {
      if (!this.running || !this.lastLineAt) return;
      const ageMs = Date.now() - this.lastLineAt;
      if (ageMs > config.oanda.staleAfterSeconds * 1000) {
        log.warn("stream stale, reconnecting", { ageMs });
        if (this.controller) this.controller.abort();
      }
    }, 5000);
    this.watchdog.unref?.();
  }

  #stopWatchdog() {
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = null;
  }

  async #connectLoop() {
    while (this.running) {
      try {
        await this.#connectOnce();
        this.backoffMs = config.oanda.reconnectMinMs;
      } catch (err) {
        if (!this.running) break;
        log.warn("stream error", { error: err.message });
      }
      if (!this.running) break;
      await sleep(this.backoffMs);
      this.backoffMs = Math.min(this.backoffMs * 2, config.oanda.reconnectMaxMs);
    }
  }

  async #connectOnce() {
    const list = instruments.symbols().join(",");
    // the account id comes from the token unless one was configured
    const accountId = await resolveAccountId();
    const url =
      `${config.oanda.streamHost}/v3/accounts/${accountId}` +
      `/pricing/stream?instruments=${encodeURIComponent(list)}`;

    this.controller = new AbortController();
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.oanda.token}`,
        "Accept-Datetime-Format": "RFC3339",
      },
      signal: this.controller.signal,
    });

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`oanda stream ${res.status}: ${text.slice(0, 200)}`);
    }

    log.info("stream connected", { instruments: list });
    this.lastLineAt = Date.now();
    priceBus.publishStatus({ connected: true, running: true });

    const decoder = new TextDecoder();
    let buffer = "";
    for await (const chunk of res.body) {
      this.lastLineAt = Date.now();
      buffer += decoder.decode(chunk, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) this.#handleLine(line);
        newline = buffer.indexOf("\n");
      }
    }
    priceBus.publishStatus({ connected: false, running: this.running });
    throw new Error("stream ended");
  }

  #handleLine(line) {
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    if (msg.type === "HEARTBEAT") return;
    if (msg.type !== "PRICE") return;

    const tick = midFromPriceMessage(msg);
    if (!tick || !tick.tradeable) return;

    this.lastMid.set(tick.instrument, tick.mid);
    priceBus.publishTick(tick); // consumed by the engine, then discarded
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { OandaStream, oandaStream: new OandaStream() };





