"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  isLaceInstalled,
  connectLace,
  disconnectLace,
  DEFAULT_CONFIG,
  type WalletState,
  type TokenBalance,
} from "@midnight-dex/sdk";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface WalletContextValue {
  /** Current wallet connection state. */
  state: WalletState;
  /** Initiate a Lace wallet connection. */
  connect: () => Promise<void>;
  /** Disconnect from Lace and clear local state. */
  disconnect: () => void;
  /** Token balances (populated after a successful connection). */
  balances: TokenBalance[];
}

export const WalletContext = createContext<WalletContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * WalletProvider manages the Lace wallet connection lifecycle.
 *
 * 1. On mount, checks whether the Lace extension is installed.
 * 2. Exposes `connect()` which calls `connectLace()` from the SDK.
 * 3. Exposes `disconnect()` which clears local state.
 * 4. After connection, provides mock balances (to be replaced with
 *    real on-chain reads in a later task).
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({ status: "disconnected" });
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  // On mount, check if Lace is installed
  useEffect(() => {
    if (!isLaceInstalled()) {
      setState({ status: "not-installed" });
    }
  }, []);

  const connect = useCallback(async () => {
    setState({ status: "connecting" });
    try {
      const { address, connectedApi } = await connectLace();
      setState({ status: "connected", address, connectedApi });

      // Load mock balances for now (will be replaced with real reads later)
      const mockBalances: TokenBalance[] = DEFAULT_CONFIG.tokens.map(
        (token) => {
          const amounts: Record<string, number> = {
            tMIDN: 1000,
            tUSDC: 5000,
            tBTC: 0.5,
          };
          const balance = amounts[token.symbol] ?? 0;
          return {
            symbol: token.symbol,
            balance,
            formatted: balance.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            }),
          };
        },
      );
      setBalances(mockBalances);
    } catch (err) {
      setState({
        status: "error",
        error:
          err instanceof Error ? err.message : "Failed to connect wallet",
      });
    }
  }, []);

  const disconnect = useCallback(() => {
    disconnectLace();
    setState({ status: "disconnected" });
    setBalances([]);
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({ state, connect, disconnect, balances }),
    [state, connect, disconnect, balances],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
