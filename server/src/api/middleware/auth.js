"use strict";

const config = require("../../config");
const { unauthorized } = require("../../utils/errors");

/**
 * Function key in the sideloaded app plus the username in the path.
 * Accepted as `x-api-key`, `?code=` or `Authorization: Bearer`.
 */
function apiKeyAuth(req, _res, next) {
  if (!config.apiKey) return next(); // local dev without a key

  const header = req.get("x-api-key");
  const bearer = (req.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const query = req.query.code;
  const provided = header || bearer || query;

  if (provided && provided === config.apiKey) return next();
  return next(unauthorized("bad api key"));
}

module.exports = { apiKeyAuth };

