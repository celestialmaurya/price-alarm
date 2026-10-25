"use strict";

const config = require("../config");
const { createLogger } = require("../utils/logger");

const log = createLogger("oandaAccount");

/**
 * OANDA's v3 pricing stream lives under /v3/accounts/{accountID}/pricing/stream,
 * so an account id is always part of the URL. You do not have to supply one:
 * the token itself can list the accounts it belongs to, and we take the first.
 *
 * Set OANDA_ACCOUNT_ID in secrets.js only if the token has several accounts and
 * you want a specific one.
 */
let cached = null;

async function listAccounts() {
  if (!config.oanda.token) throw new Error("OANDA_API_TOKEN is not set");

  const res = await fetch(`${config.oanda.restHost}/v3/accounts`, {
    headers: { Authorization: `Bearer ${config.oanda.token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`oanda /v3/accounts ${res.status}: ${text.slice(0, 200)}`);
  }

  const body = await res.json();
  return Array.isArray(body.accounts) ? body.accounts : [];
}

/** Returns the account id to stream from, resolving it once and caching it. */
async function resolveAccountId() {
  if (config.oanda.accountId) return config.oanda.accountId;
  if (cached) return cached;

  const accounts = await listAccounts();
  if (accounts.length === 0) {
    throw new Error(
      `no OANDA accounts for this token in the "${config.oanda.environment}" environment`
    );
  }

  cached = accounts[0].id;
  if (accounts.length > 1) {
    log.warn("token has several accounts, using the first", {
      using: cached,
      available: accounts.map((a) => a.id),
    });
  } else {
    log.info("account resolved from token", { accountId: cached });
  }
  return cached;
}

function reset() {
  cached = null;
}

module.exports = { resolveAccountId, listAccounts, reset };

