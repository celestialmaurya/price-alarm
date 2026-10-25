"use strict";

class HttpError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

const notFound = (msg) => new HttpError(404, "not_found", msg);
const badRequest = (msg) => new HttpError(400, "bad_request", msg);
const unauthorized = (msg) => new HttpError(401, "unauthorized", msg);
const conflict = (msg) => new HttpError(409, "conflict", msg);

module.exports = { HttpError, notFound, badRequest, unauthorized, conflict };

