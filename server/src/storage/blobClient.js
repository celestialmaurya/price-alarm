"use strict";

const { BlobServiceClient } = require("@azure/storage-blob");
const config = require("../config");

let containerClient = null;

/**
 * Lazily creates the container client. Connection string only -
 * the container is private and never exposed.
 */
function getContainerClient() {
  if (containerClient) return containerClient;
  if (!config.blob.connectionString) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING is not set");
  }
  const service = BlobServiceClient.fromConnectionString(
    config.blob.connectionString
  );
  containerClient = service.getContainerClient(config.blob.container);
  return containerClient;
}

function getBlockBlobClient(blobName) {
  return getContainerClient().getBlockBlobClient(blobName);
}

async function streamToString(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

module.exports = { getContainerClient, getBlockBlobClient, streamToString };

