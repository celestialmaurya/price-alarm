"use strict";

/**
 * The watched price: (best ask + best bid) / 2.
 * OANDA sends bids/asks as sorted ladders; index 0 is the best.
 */
function bestPrice(ladder) {
  if (!Array.isArray(ladder) || ladder.length === 0) return null;
  const value = Number(ladder[0].price);
  return Number.isFinite(value) ? value : null;
}

function midFromPriceMessage(msg) {
  const bid = bestPrice(msg.bids);
  const ask = bestPrice(msg.asks);
  if (bid === null || ask === null) return null;
  return {
    instrument: msg.instrument,
    bid,
    ask,
    mid: (bid + ask) / 2,
    time: msg.time,
    tradeable: msg.tradeable !== false,
  };
}

module.exports = { bestPrice, midFromPriceMessage };

