// config.ts -- Network configuration for Midnight testnet deployment.
//
// Override any value via environment variables:
//   MIDNIGHT_RPC_URL, MIDNIGHT_INDEXER_URL, MIDNIGHT_PROOF_SERVER_URL

export const TESTNET_CONFIG = {
  rpcUrl:
    process.env.MIDNIGHT_RPC_URL ?? "https://rpc.testnet-02.midnight.network",
  indexerUrl:
    process.env.MIDNIGHT_INDEXER_URL ??
    "https://indexer.testnet-02.midnight.network",
  proofServerUrl:
    process.env.MIDNIGHT_PROOF_SERVER_URL ?? "http://localhost:6300",
};
