"use strict";

/**
 * Checks everything you hard coded in src/config/secrets.js:
 *   node scripts/checkSetup.js
 *
 * It touches Azure, OANDA and Firebase once each and prints a short report.
 * Nothing is written except the alarms container, which is created if missing.
 */
const config = require("../src/config");
const { getContainerClient } = require("../src/storage/blobClient");
const { resolveAccountId, listAccounts } = require("../src/pricing/oandaAccount");
const userStore = require("../src/storage/userStore");
const fcmClient = require("../src/push/fcmClient");

const ok = (m) => console.log(`  ok    ${m}`);
const bad = (m) => console.log(`  FAIL  ${m}`);

async function checkApiKey() {
  console.log("api key");
  if (!config.apiKey || config.apiKey.startsWith("put-a-long-random")) {
    bad("API_KEY is still the placeholder");
    return;
  }
  ok(`API_KEY set (${config.apiKey.length} chars)`);
}

async function checkBlob() {
  console.log("azure blob");
  try {
    const container = getContainerClient();
    await container.createIfNotExists();
    const names = await userStore.listUsernames();
    ok(`container "${config.blob.container}" reachable`);
    ok(names.length ? `users: ${names.join(", ")}` : "no user files yet");
  } catch (err) {
    bad(`blob: ${err.message}`);
  }
}

async function checkOanda() {
  console.log("oanda");
  if (!config.oanda.token || config.oanda.token.startsWith("paste-your-new")) {
    bad("OANDA_API_TOKEN is missing");
    return;
  }

  let accountId;
  try {
    const accounts = await listAccounts();
    if (accounts.length === 0) {
      bad(`token has no accounts in the "${config.oanda.environment}" environment`);
      return;
    }
    accountId = await resolveAccountId();
    ok(`token valid, ${accounts.length} account(s): ${accounts.map((a) => a.id).join(", ")}`);
    ok(`streaming from ${accountId}${config.oanda.accountId ? " (pinned in secrets.js)" : " (auto)"}`);
  } catch (err) {
    bad(`oanda: ${err.message}`);
    return;
  }

  const url =
    `${config.oanda.restHost}/v3/accounts/${accountId}` +
    `/pricing?instruments=XAU_USD`;
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${config.oanda.token}` },
    });
    if (!res.ok) {
      bad(`pricing returned ${res.status} ${await res.text()}`);
      return;
    }
    const body = await res.json();
    const price = body.prices && body.prices[0];
    if (!price) {
      bad("no price in the response");
      return;
    }
    const bid = Number(price.bids[0].price);
    const ask = Number(price.asks[0].price);
    ok(`XAU_USD mid = ${((bid + ask) / 2).toFixed(3)}`);
  } catch (err) {
    bad(`oanda pricing: ${err.message}`);
  }
}

function checkFirebase() {
  console.log("firebase");
  if (!config.push.serviceAccountJson) {
    bad("FIREBASE_SERVICE_ACCOUNT is empty, pushes will not be sent");
    return;
  }
  const app = fcmClient.init();
  if (app) ok("service account accepted");
  else bad("service account rejected, see the error above");
}

async function main() {
  console.log("\nprice-alarm setup check\n");
  await checkApiKey();
  await checkBlob();
  await checkOanda();
  checkFirebase();
  console.log("\ndone\n");
  process.exit(0);
}

main();



