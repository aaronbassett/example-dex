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
  hasExistingWallet,
  loadOrCreateWallet,
  resetWallet as sdkResetWallet,
  fundWallet,
  getBalances,
  type DexWallet,
  type FundingStatus,
  type TokenBalance,
} from "@midnight-dex/sdk";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface WalletContextValue {
  /** The loaded wallet, or null while hydrating / before creation. */
  wallet: DexWallet | null;
  /** True during the initial client-side wallet load. */
  isLoading: boolean;
  /** True while the first-time funding flow is in progress. */
  isOnboarding: boolean;
  /** Current funding progress (only meaningful during onboarding). */
  fundingStatus: FundingStatus | null;
  /** Token balances after funding completes. */
  balances: TokenBalance[];
  /** Wipe the wallet from localStorage and reload the page. */
  resetWallet: () => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * WalletProvider handles the full wallet lifecycle:
 *
 * 1. On mount (client only), check if a wallet already exists.
 * 2. Load or create one via the SDK.
 * 3. If this is a brand-new wallet, kick off the funding flow so
 *    the user gets testnet tokens automatically.
 * 4. Once funding completes, fetch balances.
 *
 * The provider exposes all of this state so child components can
 * render loading/onboarding UI and wallet info.
 */
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<DexWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(null);
  const [balances, setBalances] = useState<TokenBalance[]>([]);

  // Run once on mount (client only) to load/create the wallet
  useEffect(() => {
    const isExisting = hasExistingWallet();
    const loaded = loadOrCreateWallet();

    if (!loaded) {
      // SSR or no window — shouldn't happen inside a client component,
      // but guard just in case
      setIsLoading(false);
      return;
    }

    setWallet(loaded);
    setIsLoading(false);

    // First-time user: fund the wallet with testnet tokens
    if (!isExisting) {
      setIsOnboarding(true);

      fundWallet(loaded, (status) => {
        setFundingStatus(status);

        if (status.step === "complete") {
          // Funding finished — load balances and dismiss onboarding
          setBalances(getBalances(loaded));
          setIsOnboarding(false);
        }

        if (status.step === "error") {
          setIsOnboarding(false);
        }
      });
    } else {
      // Returning user: balances are already available
      setBalances(getBalances(loaded));
    }
  }, []);

  const resetWallet = useCallback(() => {
    sdkResetWallet();
    // Force a full reload so every component re-initialises
    window.location.reload();
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      isLoading,
      isOnboarding,
      fundingStatus,
      balances,
      resetWallet,
    }),
    [wallet, isLoading, isOnboarding, fundingStatus, balances, resetWallet],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
