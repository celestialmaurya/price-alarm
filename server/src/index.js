"use strict";

const config = require("./config");
const { createApp } = require("./api/app");
const userCache = require("./cache/userCache");
const { alarmEngine } = require("./alarms/alarmEngine");
const { oandaStream } = require("./pricing/oandaStream");
const { WeekendScheduler } = require("./scheduler/weekendScheduler");
const fcmClient = require("./push/fcmClient");
const { createLogger } = require("./utils/logger");

const log = createLogger("boot");

async function main() {
  fcmClient.init();

  try {
    await userCache.loadAll();
  } catch (err) {
    log.error("cache warm-up failed, continuing", { error: err.message });
  }

  alarmEngine.start();

  const scheduler = new WeekendScheduler(oandaStream);
  scheduler.start();

  const server = createApp().listen(config.port, () => {
    log.info("api listening", { port: config.port });
  });

  const shutdown = (signal) => {
    log.info("shutting down", { signal });
    scheduler.stop();
    oandaStream.stop("shutdown");
    alarmEngine.stop();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("unhandledRejection", (err) =>
    log.error("unhandled rejection", { error: String(err) })
  );
}

main().catch((err) => {
  log.error("fatal", { error: err.message });
  process.exit(1);
});

