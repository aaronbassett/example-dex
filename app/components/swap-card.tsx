"use client";

import { useState, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownUp } from "lucide-react";
import {
  DEFAULT_CONFIG,
  calculateSwapOutput,
  getExchangeRate,
  executeSwap,
  type SwapStatus,
} from "@midnight-dex/sdk";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TokenSelector } from "@/components/token-selector";
import { useWallet } from "@/hooks/use-wallet";

const tokens = DEFAULT_CONFIG.tokens;

/** Human-friendly labels shown on the swap button for each transaction stage. */
const STATUS_LABELS: Record<SwapStatus, string> = {
  idle: "Swap",
  building: "Building transaction...",
  proving: "Generating proof...",
  submitting: "Submitting...",
  confirming: "Confirming...",
  success: "Swap complete!",
  error: "Swap failed",
};

const LACE_INSTALL_URL =
  "https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk";

/**
 * Inner swap form that reads URL search params for pair pre-selection.
 *
 * Wrapped in a Suspense boundary by SwapCard because useSearchParams()
 * requires it in Next.js 15.
 */
function SwapForm() {
  const searchParams = useSearchParams();
  const { state, connect, balances } = useWallet();

  // Pre-select tokens from URL query params (e.g. ?from=tMIDN&to=tUSDC),
  // falling back to sensible defaults
  const initialFrom = searchParams.get("from") || tokens[0]?.symbol || "tMIDN";
  const initialTo = searchParams.get("to") || tokens[1]?.symbol || "tUSDC";

  const [fromSymbol, setFromSymbol] = useState(initialFrom);
  const [toSymbol, setToSymbol] = useState(initialTo);
  const [fromAmount, setFromAmount] = useState("");
  const [status, setStatus] = useState<SwapStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Look up the wallet balance for the currently selected from/to tokens
  const fromBalance = balances.find((b) => b.symbol === fromSymbol);
  const toBalance = balances.find((b) => b.symbol === toSymbol);

  // Calculate the output amount whenever the input or pair changes
  const outputAmount = useMemo(() => {
    const parsed = parseFloat(fromAmount);
    if (!fromAmount || isNaN(parsed) || parsed <= 0) return null;
    return calculateSwapOutput(parsed, fromSymbol, toSymbol);
  }, [fromAmount, fromSymbol, toSymbol]);

  // Format the exchange rate for display (e.g. "1 tMIDN = 1,800 tUSDC")
  const rateDisplay = useMemo(() => {
    const rate = getExchangeRate(fromSymbol, toSymbol);
    if (rate === null || fromSymbol === toSymbol) return null;
    return `1 ${fromSymbol} = ${rate.toLocaleString("en-US", { maximumFractionDigits: 6 })} ${toSymbol}`;
  }, [fromSymbol, toSymbol]);

  /** Swap the from/to tokens (and clear the input). */
  const handleFlip = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFromAmount("");
    setError(null);
  }, [fromSymbol, toSymbol]);

  /** When the user picks a new "from" token, ensure the "to" token differs. */
  const handleFromSelect = useCallback(
    (symbol: string) => {
      setFromSymbol(symbol);
      if (symbol === toSymbol) {
        // Auto-flip to avoid same-token pair
        setToSymbol(fromSymbol);
      }
      setError(null);
    },
    [toSymbol, fromSymbol],
  );

  /** When the user picks a new "to" token, ensure the "from" token differs. */
  const handleToSelect = useCallback(
    (symbol: string) => {
      setToSymbol(symbol);
      if (symbol === fromSymbol) {
        setFromSymbol(toSymbol);
      }
      setError(null);
    },
    [fromSymbol, toSymbol],
  );

  const handleSwap = useCallback(async () => {
    const parsed = parseFloat(fromAmount);
    if (isNaN(parsed) || parsed <= 0) return;

    setError(null);
    const result = await executeSwap(fromSymbol, toSymbol, parsed, setStatus);

    if (result.status === "error") {
      setError(result.error || "Unknown error");
    }

    // Reset to idle after a short delay so the user sees the final status
    setTimeout(() => setStatus("idle"), 3000);
  }, [fromAmount, fromSymbol, toSymbol]);

  // ── Gate: require wallet connection ──────────────────────────────
  // Placed after all hooks to comply with the Rules of Hooks.
  if (state.status !== "connected") {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center gap-4 p-12">
          <p className="text-center text-gray-400">
            Connect your Lace wallet to start trading
          </p>
          {state.status === "disconnected" && (
            <Button onClick={connect}>Connect Wallet</Button>
          )}
          {state.status === "not-installed" && (
            <a
              href={LACE_INSTALL_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline">Install Lace Wallet</Button>
            </a>
          )}
          {state.status === "connecting" && (
            <p className="text-sm text-gray-500">Connecting...</p>
          )}
          {state.status === "error" && (
            <>
              <p className="text-sm text-[var(--red)]">{state.error}</p>
              <Button onClick={connect} variant="outline">
                Try Again
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const isSwapping = status !== "idle" && status !== "success" && status !== "error";
  const parsedAmount = parseFloat(fromAmount);
  const hasValidAmount = fromAmount !== "" && !isNaN(parsedAmount) && parsedAmount > 0;
  const insufficientBalance =
    hasValidAmount && fromBalance !== undefined && parsedAmount > fromBalance.balance;
  const canSwap =
    !isSwapping &&
    hasValidAmount &&
    !insufficientBalance &&
    fromSymbol !== toSymbol;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardContent className="space-y-4 p-6">
        {/* --- You pay --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">You pay</label>
            {fromBalance && (
              <span className="text-xs text-gray-400">
                Balance: {fromBalance.formatted}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[var(--midnight-700)] p-3">
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={fromAmount}
              onChange={(e) => {
                setFromAmount(e.target.value);
                setError(null);
              }}
              disabled={isSwapping}
              className="w-full bg-transparent text-xl font-medium text-white placeholder:text-gray-500 focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <TokenSelector
              tokens={tokens}
              selected={fromSymbol}
              onSelect={handleFromSelect}
              disabled={isSwapping}
            />
          </div>
        </div>

        {/* --- Flip button --- */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleFlip}
            disabled={isSwapping}
            className="rounded-full border border-[var(--glass-border)] bg-[var(--midnight-600)] p-2 text-gray-400 transition-colors hover:bg-[var(--midnight-500)] hover:text-white disabled:opacity-50"
            aria-label="Swap token direction"
          >
            <ArrowDownUp className="h-4 w-4" />
          </button>
        </div>

        {/* --- You receive --- */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-400">You receive</label>
            {toBalance && (
              <span className="text-xs text-gray-400">
                Balance: {toBalance.formatted}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-[var(--midnight-700)] p-3">
            <span className="w-full text-xl font-medium text-white">
              {outputAmount !== null
                ? outputAmount.toLocaleString("en-US", { maximumFractionDigits: 6 })
                : "0.00"}
            </span>
            <TokenSelector
              tokens={tokens}
              selected={toSymbol}
              onSelect={handleToSelect}
              disabled={isSwapping}
            />
          </div>
        </div>

        {/* --- Exchange rate --- */}
        {rateDisplay && (
          <p className="text-center text-sm text-gray-400">{rateDisplay}</p>
        )}

        {/* --- Swap button --- */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSwap}
          disabled={!canSwap}
        >
          {insufficientBalance ? "Insufficient balance" : STATUS_LABELS[status]}
        </Button>

        {/* --- Error message --- */}
        {error && (
          <p className="text-center text-sm text-[var(--red)]">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * SwapCard -- the main trading interface.
 *
 * Wraps SwapForm in a Suspense boundary because it uses useSearchParams(),
 * which Next.js 15 requires to be inside Suspense when statically rendered.
 */
export function SwapCard() {
  return (
    <Suspense
      fallback={
        <Card className="mx-auto w-full max-w-md">
          <CardContent className="flex items-center justify-center p-12">
            <p className="text-gray-400">Loading...</p>
          </CardContent>
        </Card>
      }
    >
      <SwapForm />
    </Suspense>
  );
}
