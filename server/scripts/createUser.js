"use strict";

/**
 * Creates one user file by hand:
 *   node scripts/createUser.js amit
 * Requires AZURE_STORAGE_CONNECTION_STRING.
 */
const { getContainerClient, getBlockBlobClient } = require("../src/storage/blobClient");
const { emptyUser } = require("../src/storage/userModel");
const config = require("../src/config");

async function main() {
  const username = (process.argv[2] || "").toLowerCase();
  if (!/^[a-z0-9_-]{1,32}$/.test(username)) {
    console.error("usage: node scripts/createUser.js <username>");
    process.exit(1);
  }

  const container = getContainerClient();
  await container.createIfNotExists(); // private by default

  const blobName = `${username}${config.blob.fileExtension}`;
  const blob = getBlockBlobClient(blobName);
  if (await blob.exists()) {
    console.log(`${blobName} already exists`);
    return;
  }

  const body = JSON.stringify(emptyUser(username), null, 2);
  await blob.upload(body, Buffer.byteLength(body), {
    blobHTTPHeaders: { blobContentType: "application/json" },
  });
  console.log(`created ${config.blob.container}/${blobName}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

