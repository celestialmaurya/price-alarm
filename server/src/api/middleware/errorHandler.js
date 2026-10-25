"use strict";

const { createLogger } = require("../../utils/logger");

const log = createLogger("http");

function notFoundHandler(_req, res) {
  res.status(404).json({ error: "not_found" });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    log.error("request failed", { path: req.path, error: err.message });
  }
  res.status(status).json({
    error: err.code || "server_error",
    message: err.message,
  });
}

module.exports = { notFoundHandler, errorHandler };

