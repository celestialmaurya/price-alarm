"use strict";

const test = require("node:test");
const assert = require("node:assert");

const userCache = require("../src/cache/userCache");
const userStore = require("../src/storage/userStore");
const pushSender = require("../src/push/pushSender");
const runtimeState = require("../src/alarms/alarmRuntime");
const { AlarmEngine } = require("../src/alarms/alarmEngine");

// blob and FCM are replaced: this test only exercises the ring rules
let pushes = [];
pushSender.sendAlarm = async (user, alarm) => {
  pushes.push({ user: user.username, alarm: alarm.id });
  return { sent: 1, deadTokens: [] };
};
userStore.update = async (username, mutator) => {
  const user = userCache.get(username);
  await mutator(user);
  return { user, etag: "etag", result: null };
};

function setup(alarmOverrides = {}) {
  pushes = [];
  runtimeState.clear();
  const user = {
    username: "amit",
    deviceTokens: ["phone", "tablet"],
    priceAlarms: [
      {
        id: "a1",
        instrument: "XAU_USD",
        price: 2650,
        direction: "either",
        repeat: false,
        enabled: true,
        state: "armed",
        lastFiredAt: null,
        ...alarmOverrides,
      },
    ],
  };
  userCache.put("amit", user);
  return { user, engine: new AlarmEngine() };
}

const tick = (mid) => ({ instrument: "XAU_USD", mid });

test("a cross rings once, sitting on the level does not repeat it", async () => {
  const { engine } = setup();
  await engine.onTick(tick(2649)); // baseline
  await engine.onTick(tick(2650)); // cross
  await engine.onTick(tick(2650)); // still sitting there
  await engine.onTick(tick(2650));
  assert.equal(pushes.length, 1);
});

test("an alarm created while the price sits on the level stays quiet", async () => {
  const { engine } = setup();
  await engine.onTick(tick(2650)); // baseline is the level itself
  await engine.onTick(tick(2650));
  assert.equal(pushes.length, 0);
});

test("a bounce inside the quiet window does not ring again", async () => {
  const { engine } = setup({ repeat: true });
  await engine.onTick(tick(2649));
  await engine.onTick(tick(2650)); // ring
  await engine.onTick(tick(2651));
  await engine.onTick(tick(2650)); // back on the level, still quiet
  assert.equal(pushes.length, 1);
});

test("a repeat alarm rings again on a new cross after the quiet window", async () => {
  const { user, engine } = setup({ repeat: true });
  await engine.onTick(tick(2649));
  await engine.onTick(tick(2650)); // ring
  assert.equal(pushes.length, 1);

  // pretend the 2 minutes passed
  user.priceAlarms[0].lastFiredAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();

  await engine.onTick(tick(2648)); // left to the other side
  await engine.onTick(tick(2651)); // new cross
  assert.equal(pushes.length, 2);
});

test("a once alarm sends exactly one reminder while un-acked", async () => {
  const { user, engine } = setup();
  await engine.onTick(tick(2649));
  await engine.onTick(tick(2650)); // ring, now awaiting_ack
  assert.equal(user.priceAlarms[0].state, "awaiting_ack");

  user.priceAlarms[0].lastFiredAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  await engine.onTick(tick(2650)); // reminder
  user.priceAlarms[0].lastFiredAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  await engine.onTick(tick(2650)); // nothing more
  assert.equal(pushes.length, 2);
});

test("a disabled alarm never rings", async () => {
  const { engine } = setup({ enabled: false });
  await engine.onTick(tick(2649));
  await engine.onTick(tick(2650));
  assert.equal(pushes.length, 0);
});

