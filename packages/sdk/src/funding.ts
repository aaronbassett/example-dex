/**
 * Auto-funding module for testnet wallets.
 *
 * New users need gas tokens and test tokens before they can swap.
 * This module simulates the funding flow — requesting gas from the
 * testnet faucet, then minting each configured token — so the UI
 * can show progress feedback while the real faucet integration is
 * built out.
 */

import type { DexWallet } from "./wallet.js";
import type { DexConfig } from "./config.js";
import { DEFAULT_CONFIG } from "./config.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Each step in the funding pipeline, reported to the UI via callback. */
export type FundingStep =
  | "checking"
  | "funding-gas"
  | "minting-tokens"
  | "complete"
  | "error";

export interface FundingStatus {
  step: FundingStep;
  message: string;
  /** Overall progress from 0 to 100. */
  progress: number;
}

export interface TokenBalance {
  symbol: string;
  balance: number;
  /** Human-friendly string like "1,000.00" */
  formatted: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Format a number with locale-aware grouping and two decimal places. */
function formatBalance(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

// ---------------------------------------------------------------------------
// Balances
// ---------------------------------------------------------------------------

/**
 * Initial balances seeded into every new testnet wallet.
 * These mirror the amounts the real faucet + mint flow would provide.
 */
const INITIAL_BALANCES: Record<string, number> = {
  tMIDN: 1000,
  tUSDC: 5000,
  tBTC: 0.5,
};

/**
 * Retrieve balances for every token in the DEX config.
 *
 * TODO: Replace with real balance lookups.
 * The actual implementation would query the zswap coin infrastructure
 * (via the indexer or node RPC) for each token's shielded balance
 * belonging to the wallet's coinPublicKey.
 *
 * @param _wallet - The wallet whose balances to look up (unused in mock)
 * @param config  - DEX configuration; defaults to `DEFAULT_CONFIG`
 */
export function getBalances(
  _wallet: DexWallet,
  config: DexConfig = DEFAULT_CONFIG,
): TokenBalance[] {
  return config.tokens.map((token) => {
    const balance = INITIAL_BALANCES[token.symbol] ?? 0;
    return {
      symbol: token.symbol,
      balance,
      formatted: formatBalance(balance),
    };
  });
}

// ---------------------------------------------------------------------------
// Funding flow
// ---------------------------------------------------------------------------

/**
 * Fund a freshly created wallet with gas and test tokens.
 *
 * Walks through three stages — balance check, gas funding via faucet,
 * and token minting — calling `onStatus` at every transition so the
 * UI can render a progress indicator.
 *
 * TODO: Replace each stage with real network calls:
 *   1. Check existing balances via the indexer
 *   2. Request gas from the Midnight testnet faucet API
 *   3. Call the `mint` circuit on each ShieldedFungibleToken contract
 *      to credit the wallet with test tokens
 *
 * @param _wallet  - The wallet to fund (unused in mock)
 * @param onStatus - Progress callback fired at each funding stage
 * @param config   - DEX configuration; defaults to `DEFAULT_CONFIG`
 */
export async function fundWallet(
  _wallet: DexWallet,
  onStatus?: (status: FundingStatus) => void,
  config: DexConfig = DEFAULT_CONFIG,
): Promise<void> {
  // Stage 1 — Check whether the wallet already has balances
  onStatus?.({
    step: "checking",
    message: "Checking existing balances...",
    progress: 10,
  });
  await delay(800);

  // Stage 2 — Request gas tokens from the testnet faucet
  // TODO: POST to the faucet endpoint with the wallet's coinPublicKey
  onStatus?.({
    step: "funding-gas",
    message: "Requesting gas from faucet...",
    progress: 30,
  });
  await delay(1500);

  // Stage 3 — Mint each test token into the wallet
  const tokens = config.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const progress = 50 + Math.round((i / tokens.length) * 40);

    // TODO: Call the ShieldedFungibleToken `mint` circuit for this token
    onStatus?.({
      step: "minting-tokens",
      message: `Minting ${INITIAL_BALANCES[token.symbol] ?? 0} ${token.symbol}...`,
      progress,
    });
    await delay(1200);
  }

  // Done
  onStatus?.({
    step: "complete",
    message: "Wallet funded successfully",
    progress: 100,
  });
}
