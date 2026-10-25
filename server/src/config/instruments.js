"use strict";

const list = require("./instruments.json");

/** Instruments the worker subscribes to and the app shows in its dropdown. */
function all() {
  return list.map((i) => ({ ...i }));
}

function symbols() {
  return list.map((i) => i.symbol);
}

function isKnown(symbol) {
  return list.some((i) => i.symbol === symbol);
}

module.exports = { all, symbols, isKnown };

