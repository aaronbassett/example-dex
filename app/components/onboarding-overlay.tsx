"use client";

import { useWallet } from "@/hooks/use-wallet";

/**
 * Full-screen overlay shown while a first-time user's wallet is being
 * funded with testnet tokens. Displays a progress bar and status message
 * so the user understands what's happening behind the scenes.
 */
export function OnboardingOverlay() {
  const { isOnboarding, fundingStatus } = useWallet();

  if (!isOnboarding) return null;

  const progress = fundingStatus?.progress ?? 0;
  const message = fundingStatus?.message ?? "Preparing your wallet...";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--midnight-900)]/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-[var(--glass-border)] bg-[var(--midnight-800)] p-8 text-center shadow-2xl">
        {/* Heading */}
        <h2 className="text-xl font-semibold text-white">
          Setting up your wallet
        </h2>

        {/* Progress bar */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[var(--midnight-600)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status message */}
        <p className="mt-4 text-sm text-gray-300">{message}</p>

        {/* Disclaimer */}
        <p className="mt-6 text-xs text-gray-500">
          This is a demo wallet with testnet tokens.
          <br />
          No real funds are involved.
        </p>
      </div>
    </div>
  );
}
