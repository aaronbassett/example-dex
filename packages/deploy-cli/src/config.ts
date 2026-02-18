// config.ts -- Network configuration for Midnight preprod deployment.
//
// Override any value via environment variables:
//   MIDNIGHT_RPC_URL, MIDNIGHT_INDEXER_URL, MIDNIGHT_PROOF_SERVER_URL

export const PREPROD_CONFIG = {
  rpcUrl:
    process.env.MIDNIGHT_RPC_URL ?? "https://rpc.preprod.midnight.network",
  indexerUrl:
    process.env.MIDNIGHT_INDEXER_URL ??
    "https://indexer.preprod.midnight.network",
  proofServerUrl:
    process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://localhost:6300",
};
