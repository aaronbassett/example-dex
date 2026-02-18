#!/usr/bin/env node
// Deploy the SimpleDEX contract to the Midnight testnet.
//
// Usage: MIDNIGHT_SEED="your seed phrase" pnpm deploy
//
// Prerequisites:
//   - Proof server running (docker run -p 6300:6300 midnightntwrk/proof-server:7.0.0)
//   - Wallet funded with tDUST for gas

import { createProviders } from "./providers.js";
import { TESTNET_CONFIG } from "./config.js";
import * as fs from "node:fs";
import * as path from "node:path";

async function main() {
  const seed = process.env.MIDNIGHT_SEED;
  if (!seed) {
    console.error("Error: MIDNIGHT_SEED environment variable is required");
    console.error("Usage: MIDNIGHT_SEED='your seed phrase' pnpm deploy");
    process.exit(1);
  }

  console.log("Deploying SimpleDEX to Midnight testnet...\n");

  const providers = await createProviders({
    ...TESTNET_CONFIG,
    seed,
  });

  // TODO: Import the compiled SimpleDEX contract
  // import { dex } from "@midnight-dex/contracts";
  // const { Contract } = dex;

  // TODO: Deploy using @midnight-ntwrk/midnight-js-contracts
  // import { deployContract } from "@midnight-ntwrk/midnight-js-contracts";
  // const deployedContract = await deployContract(providers, {
  //   contract: Contract,
  //   initialState: { admin: derivePublicKey(seed) },
  // });

  // For now, output a placeholder address
  const contractAddress = "DEPLOY_NOT_YET_IMPLEMENTED";

  console.log("\nSimpleDEX deployed!");
  console.log(`  Address: ${contractAddress}`);

  // Write deployed addresses to a JSON file
  const addressesPath = path.resolve(
    import.meta.dirname,
    "../deployed-addresses.json",
  );
  const addresses = {
    simpleDex: {
      address: contractAddress,
      deployedAt: new Date().toISOString(),
      network: "testnet-02",
    },
  };

  fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2) + "\n");
  console.log(`  Addresses written to: ${addressesPath}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
