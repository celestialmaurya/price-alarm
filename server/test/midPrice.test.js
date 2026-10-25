"use strict";

const test = require("node:test");
const assert = require("node:assert");
const { midFromPriceMessage } = require("../src/pricing/midPrice");

test("mid is (best bid + best ask) / 2", () => {
  const tick = midFromPriceMessage({
    type: "PRICE",
    instrument: "XAU_USD",
    bids: [{ price: "2649.80" }, { price: "2649.70" }],
    asks: [{ price: "2650.20" }, { price: "2650.30" }],
    time: "2026-10-25T10:00:00Z",
  });
  assert.equal(tick.mid, 2650);
  assert.equal(tick.instrument, "XAU_USD");
});

test("missing ladder yields nothing", () => {
  assert.equal(midFromPriceMessage({ bids: [], asks: [] }), null);
});

