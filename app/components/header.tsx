"use client";

import { NavTabs } from "@/components/nav-tabs";
import { WalletBadge } from "@/components/wallet-badge";

/**
 * Fixed top header with glass-morphism background.
 * Contains the app logo, navigation tabs, and wallet badge.
 */
export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        {/* Logo */}
        <span className="text-lg font-bold tracking-tight">
          <span className="text-[var(--accent-light)]">Midnight</span>
          <span className="text-white">DEX</span>
        </span>

        {/* Center: navigation tabs */}
        <NavTabs />

        {/* Right: wallet status */}
        <WalletBadge />
      </div>
    </header>
  );
}
