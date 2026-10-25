"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { detectCross, hasLeftToOtherSide } = require("../src/alarms/crossDetector");

test("either: up cross", () => {
  assert.equal(detectCross(2649, 2650.5, 2650, "either"), "up");
});

test("either: down cross", () => {
  assert.equal(detectCross(2651, 2650, 2650, "either"), "down");
});

test("sitting on the level is not a cross", () => {
  assert.equal(detectCross(2650, 2650, 2650, "either"), null);
});

test("no baseline means no ring", () => {
  assert.equal(detectCross(null, 2650, 2650, "either"), null);
});

test("rises_to ignores a fall onto the level", () => {
  assert.equal(detectCross(2651, 2650, 2650, "rises_to"), null);
  assert.equal(detectCross(2649, 2650, 2650, "rises_to"), "up");
});

test("falls_to ignores a rise onto the level", () => {
  assert.equal(detectCross(2649, 2650, 2650, "falls_to"), null);
  assert.equal(detectCross(2651, 2650, 2650, "falls_to"), "down");
});

test("repeat re-arm needs the other side", () => {
  assert.equal(hasLeftToOtherSide("up", 2650, 2650), false);
  assert.equal(hasLeftToOtherSide("up", 2649, 2650), true);
  assert.equal(hasLeftToOtherSide("down", 2651, 2650), true);
});

