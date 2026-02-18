#!/usr/bin/env node
// Set initial exchange rates on the deployed SimpleDEX contract.
//
// Usage: MIDNIGHT_SEED="your admin seed" pnpm deploy:set-rates
//
// Prerequisites:
//   - SimpleDEX already deployed (run `pnpm deploy` first)
//   - Proof server running
//   - MIDNIGHT_SEED must be the admin seed used during deployment

import { createProviders } from "./providers.js";
import { TESTNET_CONFIG } from "./config.js";
import * as fs from "node:fs";
import * as path from "node:path";

// Rate scaling factor -- rates are stored as integers on-chain.
// A rate of 1800 means 1800.000000 with 6 decimal places.
const RATE_SCALE = 1_000_000;

const RATES_TO_SET = [
  { tokenA: "tMIDN", tokenB: "tUSDC", rate: 1800 * RATE_SCALE },
  {
    tokenA: "tUSDC",
    tokenB: "tMIDN",
    rate: Math.round((1 / 1800) * RATE_SCALE),
  },
  {
    tokenA: "tMIDN",
    tokenB: "tBTC",
    rate: Math.round(0.02667 * RATE_SCALE),
  },
  {
    tokenA: "tBTC",
    tokenB: "tMIDN",
    rate: Math.round((1 / 0.02667) * RATE_SCALE),
  },
  {
    tokenA: "tUSDC",
    tokenB: "tBTC",
    rate: Math.round(0.0000148 * RATE_SCALE),
  },
  {
    tokenA: "tBTC",
    tokenB: "tUSDC",
    rate: Math.round((1 / 0.0000148) * RATE_SCALE),
  },
];

async function main() {
  const seed = process.env.MIDNIGHT_SEED;
  if (!seed) {
    console.error("Error: MIDNIGHT_SEED environment variable is required");
    process.exit(1);
  }

  // Read deployed contract address
  const addressesPath = path.resolve(
    import.meta.dirname,
    "../deployed-addresses.json",
  );
  if (!fs.existsSync(addressesPath)) {
    console.error(
      "Error: deployed-addresses.json not found. Run deploy first.",
    );
    process.exit(1);
  }

  const addresses = JSON.parse(fs.readFileSync(addressesPath, "utf-8"));
  const dexAddress = addresses.simpleDex?.address;

  if (!dexAddress || dexAddress === "DEPLOY_NOT_YET_IMPLEMENTED") {
    console.error("Error: SimpleDEX has not been deployed yet.");
    process.exit(1);
  }

  console.log(`Setting rates on SimpleDEX at ${dexAddress}...\n`);

  const providers = await createProviders({
    ...TESTNET_CONFIG,
    seed,
  });

  // TODO: Connect to deployed contract
  // import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
  // const contract = await findDeployedContract(providers, {
  //   contractAddress: dexAddress,
  //   contract: Contract,
  // });

  for (const { tokenA, tokenB, rate } of RATES_TO_SET) {
    console.log(
      `  Setting ${tokenA}/${tokenB} = ${rate} (${rate / RATE_SCALE})...`,
    );
    // TODO: Call set_rate circuit
    // const tokenAHash = hashTokenName(tokenA);
    // const tokenBHash = hashTokenName(tokenB);
    // await contract.callTx.set_rate(tokenAHash, tokenBHash, BigInt(rate));
    console.log(`    Done`);
  }

  // TODO: Verify rates by reading them back
  // for (const { tokenA, tokenB, rate } of RATES_TO_SET) {
  //   const tokenAHash = hashTokenName(tokenA);
  //   const tokenBHash = hashTokenName(tokenB);
  //   const onChainRate = await contract.callTx.get_rate(tokenAHash, tokenBHash);
  //   if (onChainRate !== BigInt(rate)) {
  //     throw new Error(`Rate verification failed for ${tokenA}/${tokenB}`);
  //   }
  // }

  console.log("\nAll rates set successfully!");
}

main().catch((err) => {
  console.error("Failed to set rates:", err);
  process.exit(1);
});
