"use strict";

const express = require("express");
const { apiKeyAuth } = require("./middleware/auth");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");
const healthRoutes = require("./routes/health.routes");
const usersRoutes = require("./routes/users.routes");
const instrumentsRoutes = require("./routes/instruments.routes");

function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "64kb" }));

  app.use("/health", healthRoutes);

  app.use(apiKeyAuth);
  app.use("/instruments", instrumentsRoutes);
  app.use("/users", usersRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };

