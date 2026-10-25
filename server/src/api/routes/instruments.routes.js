"use strict";

const express = require("express");
const instruments = require("../../config/instruments");

const router = express.Router();

/** GET /instruments - dropdown source. v1 is XAUUSD only. */
router.get("/", (_req, res) => {
  res.json({ instruments: instruments.all() });
});

module.exports = router;

