"use client";

import { useContext } from "react";
import { WalletContext } from "@/lib/wallet-context";

/**
 * Access wallet state from any component inside WalletProvider.
 *
 * Returns the current connection state, connect/disconnect actions,
 * and token balances.
 *
 * Throws if called outside the provider -- this is intentional so
 * missing providers are caught early during development.
 */
export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
