"use strict";

const express = require("express");
const { asyncHandler } = require("../middleware/asyncHandler");
const { assertUsername } = require("../../storage/userModel");
const alarmService = require("../../services/alarmService");
const { badRequest, notFound } = require("../../utils/errors");

const router = express.Router();

// every route in this file is scoped to one username: users never see each other
router.param("name", (req, _res, next, value) => {
  try {
    req.username = assertUsername(value);
    next();
  } catch (err) {
    next(err);
  }
});

/** GET /users/:name - 200 if the file exists, 404 otherwise. */
router.get(
  "/:name",
  asyncHandler(async (req, res) => {
    const exists = await alarmService.userExists(req.username);
    if (!exists) throw notFound("price alerts are not enabled for this user");
    res.json({ username: req.username, enabled: true });
  })
);

/** GET /users/:name/alarms */
router.get(
  "/:name/alarms",
  asyncHandler(async (req, res) => {
    res.json({ alarms: await alarmService.listAlarms(req.username) });
  })
);

/** PUT /users/:name/alarms - create or update one rule. */
router.put(
  "/:name/alarms",
  asyncHandler(async (req, res) => {
    const alarm = await alarmService.upsertAlarm(req.username, req.body);
    res.json({ alarm });
  })
);

/** DELETE /users/:name/alarms/:id */
router.delete(
  "/:name/alarms/:id",
  asyncHandler(async (req, res) => {
    await alarmService.deleteAlarm(req.username, req.params.id);
    res.json({ deleted: true });
  })
);

/** POST /users/:name/alarms/:id/ack - once-alarms are deleted here. */
router.post(
  "/:name/alarms/:id/ack",
  asyncHandler(async (req, res) => {
    const status = await alarmService.acknowledge(req.username, req.params.id);
    res.json({ status });
  })
);

/** POST /users/:name/device - save this device's FCM token. */
router.post(
  "/:name/device",
  asyncHandler(async (req, res) => {
    const token = req.body && req.body.token;
    if (!token || typeof token !== "string") throw badRequest("missing token");
    const count = await alarmService.addDevice(req.username, token);
    res.json({ devices: count });
  })
);

/** DELETE /users/:name/device */
router.delete(
  "/:name/device",
  asyncHandler(async (req, res) => {
    const token = (req.body && req.body.token) || req.query.token;
    if (!token) throw badRequest("missing token");
    const count = await alarmService.removeDevice(req.username, token);
    res.json({ devices: count });
  })
);

module.exports = router;

