"use strict";

const config = require("../config");
const { createLogger } = require("../utils/logger");

const log = createLogger("scheduler");

/**
 * Weekend shutdown. The HTTP API keeps serving; only the OANDA stream and
 * the engine are parked on Saturday and Sunday (market time zone).
 */
function currentWeekday(timeZone, now = new Date()) {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(now);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
}

function isMarketOpen(now = new Date()) {
  const day = currentWeekday(config.scheduler.timeZone, now);
  return !config.scheduler.offDays.includes(day);
}

class WeekendScheduler {
  constructor(stream) {
    this.stream = stream;
    this.timer = null;
  }

  start() {
    this.apply();
    this.timer = setInterval(() => this.apply(), config.scheduler.checkIntervalMs);
    this.timer.unref?.();
    log.info("scheduler started", {
      timeZone: config.scheduler.timeZone,
      offDays: config.scheduler.offDays,
    });
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  apply() {
    const open = isMarketOpen();
    if (open && !this.stream.isRunning()) {
      log.info("market open, starting stream");
      this.stream.start();
    } else if (!open && this.stream.isRunning()) {
      log.info("weekend, stopping stream");
      this.stream.stop("weekend");
    }
  }
}

module.exports = { WeekendScheduler, isMarketOpen, currentWeekday };

