// @midnight-dex/deploy-cli
//
// CLI tools for deploying and managing the SimpleDEX contract on Midnight testnet.
//
// Scripts:
//   pnpm deploy           — Deploy the SimpleDEX contract
//   pnpm deploy:set-rates — Seed initial exchange rates
//
// See deploy-dex.ts and set-rates.ts for usage details.

export { createProviders, type DeploymentProviders } from "./providers.js";
export { TESTNET_CONFIG } from "./config.js";
