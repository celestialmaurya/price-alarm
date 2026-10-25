"use strict";

const express = require("express");
const { oandaStream } = require("../../pricing/oandaStream");
const { isMarketOpen } = require("../../scheduler/weekendScheduler");

const router = express.Router();

/** Unauthenticated liveness probe plus a tiny stream diagnostic. */
router.get("/", (_req, res) => {
  res.json({
    ok: true,
    marketOpen: isMarketOpen(),
    stream: oandaStream.snapshot(),
    time: new Date().toISOString(),
  });
});

module.exports = router;

