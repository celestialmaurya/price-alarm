"use strict";

const config = require("../config");
const userCache = require("../cache/userCache");
const userStore = require("../storage/userStore");
const runtimeState = require("./alarmRuntime");
const { detectCross, hasLeftToOtherSide } = require("./crossDetector");
const pushSender = require("../push/pushSender");
const priceBus = require("../pricing/priceBus");
const { createLogger } = require("../utils/logger");

const log = createLogger("alarmEngine");

/**
 * Turns mid ticks into at most one push per real cross.
 *
 * Rules enforced here:
 *  - an alarm needs a baseline mid before it can fire (no ring when created
 *    while the price already sits on the level)
 *  - 2 minutes of silence after any ring
 *  - repeat alarms must see the other side of the level before ringing again
 *  - once alarms stay awaiting_ack, get exactly one reminder after the quiet
 *    window, then stay quiet until a brand new cross
 */
class AlarmEngine {
  constructor() {
    this.unsubscribe = null;
    this.firing = new Set(); // guards against overlapping async fires
  }

  start() {
    if (this.unsubscribe) return;
    this.unsubscribe = priceBus.onTick((tick) => {
      this.onTick(tick).catch((err) =>
        log.error("tick handling failed", { error: err.message })
      );
    });
    log.info("engine started");
  }

  stop() {
    if (this.unsubscribe) this.unsubscribe();
    this.unsubscribe = null;
  }

  /** Seeds the baseline so a freshly created alarm cannot ring on the spot. */
  seedBaseline(username, alarm, mid) {
    const state = runtimeState.get(username, alarm.id);
    state.previousMid = Number.isFinite(mid) ? mid : null;
    state.needsReset = false;
    state.firedDirection = null;
    state.reminders = 0;
  }

  forget(username, alarmId) {
    runtimeState.reset(username, alarmId);
  }

  async onTick(tick) {
    const now = Date.now();
    for (const user of userCache.all()) {
      for (const alarm of user.priceAlarms || []) {
        if (!alarm.enabled) continue;
        if (alarm.instrument !== tick.instrument) continue;
        await this.#evaluate(user, alarm, tick.mid, now);
      }
    }
  }

  async #evaluate(user, alarm, mid, now) {
    const state = runtimeState.get(user.username, alarm.id);

    // first tick this alarm ever sees: baseline only, never a ring
    if (state.previousMid === null) {
      state.previousMid = mid;
      return;
    }

    // has the price left the level since the last ring?
    if (state.needsReset && hasLeftToOtherSide(state.firedDirection, mid, alarm.price)) {
      state.needsReset = false;
    }

    const cross = detectCross(state.previousMid, mid, alarm.price, alarm.direction);
    state.previousMid = mid;

    const lastFired = alarm.lastFiredAt ? Date.parse(alarm.lastFiredAt) : 0;
    const quietOver = now - lastFired >= config.alarms.quietWindowMs;

    if (cross && !state.needsReset && quietOver) {
      await this.#fire(user, alarm, cross, now, "cross");
      return;
    }

    // un-acked once alarm: exactly one reminder when the quiet window ends
    if (
      !alarm.repeat &&
      alarm.state === "awaiting_ack" &&
      quietOver &&
      lastFired > 0 &&
      state.reminders < config.alarms.unackedReminders
    ) {
      state.reminders += 1;
      await this.#fire(user, alarm, state.firedDirection, now, "reminder");
    }
  }

  async #fire(user, alarm, direction, now, reason) {
    const guard = `${user.username}:${alarm.id}`;
    if (this.firing.has(guard)) return;
    this.firing.add(guard);

    try {
      const firedAtIso = new Date(now).toISOString();

      // cache first so a second tick in the same second cannot ring again
      alarm.lastFiredAt = firedAtIso;
      alarm.state = alarm.repeat ? "armed" : "awaiting_ack";

      const state = runtimeState.get(user.username, alarm.id);
      state.needsReset = true;
      if (direction) state.firedDirection = direction;
      if (reason === "cross") state.reminders = 0;

      const { deadTokens } = await pushSender.sendAlarm(user, alarm, now);

      await this.#persist(user.username, alarm, firedAtIso, deadTokens);
      log.info("alarm fired", {
        username: user.username,
        alarmId: alarm.id,
        reason,
        direction,
      });
    } catch (err) {
      log.error("fire failed", { error: err.message, alarmId: alarm.id });
    } finally {
      this.firing.delete(guard);
    }
  }

  async #persist(username, alarm, firedAtIso, deadTokens) {
    const updated = await userStore.update(username, (draft) => {
      const target = draft.priceAlarms.find((a) => a.id === alarm.id);
      if (target) {
        target.lastFiredAt = firedAtIso;
        target.state = alarm.state;
      }
      if (deadTokens && deadTokens.length > 0) {
        draft.deviceTokens = draft.deviceTokens.filter(
          (t) => !deadTokens.includes(t)
        );
      }
    });
    userCache.put(username, updated.user);
  }
}

module.exports = { AlarmEngine, alarmEngine: new AlarmEngine() };

