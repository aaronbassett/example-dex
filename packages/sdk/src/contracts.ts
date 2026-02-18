/**
 * Contract interaction helpers for the SimpleDEX.
 *
 * Rate lookups attempt to read from the deployed on-chain contract first,
 * falling back to hardcoded mock rates when the contract is not yet
 * available. The swap execution is still fully mocked — it simulates
 * the ZK proof generation and on-chain confirmation latency so the UI
 * can be wired up before the contracts are deployed.
 */

import { readOnChainRate } from "./contract-reader.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Tracks the lifecycle of a swap transaction through the proving pipeline. */
export type SwapStatus =
  | "idle"
  | "building"
  | "proving"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export interface SwapResult {
  status: SwapStatus;
  txHash?: string;
  error?: string;
  inputAmount: number;
  outputAmount: number;
}

// ---------------------------------------------------------------------------
// Exchange rates
// ---------------------------------------------------------------------------

/** Rate scaling factor matching the deploy-cli's set-rates.ts. */
const RATE_SCALE = 1_000_000;

/**
 * Mock exchange rates used as a fallback when the on-chain contract
 * is not yet deployed or the indexer is unreachable.
 */
const MOCK_RATES: Record<string, number> = {
  "tMIDN/tUSDC": 1800,
  "tUSDC/tMIDN": 1 / 1800,
  "tMIDN/tBTC": 0.02667,
  "tBTC/tMIDN": 1 / 0.02667,
  "tUSDC/tBTC": 0.0000148,
  "tBTC/tUSDC": 1 / 0.0000148,
};

/**
 * Look up the exchange rate between two tokens.
 *
 * Tries to read the rate from the deployed SimpleDEX contract first
 * (if `config` is provided with a real contract address). Falls back
 * to hardcoded mock rates when the on-chain read is unavailable.
 *
 * @returns The rate, or `null` if the pair is not supported.
 */
export async function getExchangeRate(
  fromSymbol: string,
  toSymbol: string,
  config?: { indexerUrl: string; dexContractAddress: string },
): Promise<number | null> {
  if (fromSymbol === toSymbol) return 1;

  // Try reading from on-chain if config is provided and address is real
  if (config?.dexContractAddress && !config.dexContractAddress.includes("PLACEHOLDER")) {
    try {
      const rate = await readOnChainRate(fromSymbol, toSymbol, config);
      if (rate !== null) return Number(rate) / RATE_SCALE;
    } catch {
      // Fall through to mock
    }
  }

  // Fallback to mock rates
  return MOCK_RATES[`${fromSymbol}/${toSymbol}`] ?? null;
}

/**
 * Calculate how many output tokens a given input amount would yield.
 *
 * @returns The output amount, or `null` if the pair has no rate.
 */
export async function calculateSwapOutput(
  inputAmount: number,
  fromSymbol: string,
  toSymbol: string,
  config?: { indexerUrl: string; dexContractAddress: string },
): Promise<number | null> {
  const rate = await getExchangeRate(fromSymbol, toSymbol, config);
  if (rate === null) return null;
  return inputAmount * rate;
}

// ---------------------------------------------------------------------------
// Swap execution
// ---------------------------------------------------------------------------

/** Pause execution for the given number of milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Generate a mock transaction hash that looks plausible. */
function mockTxHash(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return (
    "0x" +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

/**
 * Execute a mock token swap, walking through every stage of the
 * Midnight transaction lifecycle.
 *
 * The `onStatusChange` callback fires at each stage so the UI can
 * show proof-generation progress, submission spinners, etc.
 *
 * TODO: Replace with real Midnight transaction flow:
 *   1. Build the transaction using the SimpleDEX contract's `swap` circuit
 *   2. Generate a ZK proof via `@midnight-ntwrk/compact-runtime`
 *   3. Submit the proved transaction to the Midnight node
 *   4. Wait for on-chain confirmation via the indexer
 *
 * @param fromToken  - Symbol of the token being sold (e.g. "tMIDN")
 * @param toToken    - Symbol of the token being bought (e.g. "tUSDC")
 * @param inputAmount - How many `fromToken` to swap
 * @param onStatusChange - Called whenever the swap moves to a new stage
 */
export async function executeSwap(
  fromToken: string,
  toToken: string,
  inputAmount: number,
  onStatusChange?: (status: SwapStatus) => void,
): Promise<SwapResult> {
  const outputAmount = await calculateSwapOutput(inputAmount, fromToken, toToken);
  if (outputAmount === null) {
    onStatusChange?.("error");
    return {
      status: "error",
      error: `No exchange rate for ${fromToken}/${toToken}`,
      inputAmount,
      outputAmount: 0,
    };
  }

  try {
    // Step 1 — Build the transaction
    onStatusChange?.("building");
    await delay(500);

    // Step 2 — Generate the ZK proof (the slowest step in a real flow)
    onStatusChange?.("proving");
    await delay(2000);

    // Step 3 — Submit the proved transaction to the network
    onStatusChange?.("submitting");
    await delay(1000);

    // Step 4 — Wait for on-chain confirmation
    onStatusChange?.("confirming");
    await delay(1500);

    onStatusChange?.("success");
    return {
      status: "success",
      txHash: mockTxHash(),
      inputAmount,
      outputAmount,
    };
  } catch (err) {
    onStatusChange?.("error");
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Unknown swap error",
      inputAmount,
      outputAmount: 0,
    };
  }
}
