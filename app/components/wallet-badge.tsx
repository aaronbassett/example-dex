"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

/**
 * WalletBadge — shows the connected wallet address in a pill shape.
 *
 * Clicking it opens a small dropdown with "Copy Address" and "Reset Wallet"
 * actions. The dropdown closes when clicking outside.
 */
export function WalletBadge() {
  const { wallet, isLoading, resetWallet } = useWallet();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // During SSR hydration the wallet hasn't loaded yet
  if (isLoading || !wallet) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--midnight-700)] px-3 py-1.5 text-sm">
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-500" />
        <span className="text-gray-400">Loading...</span>
      </div>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(wallet.coinPublicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Badge button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--midnight-700)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--midnight-600)]"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-mono text-gray-300">{wallet.address}</span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-lg border border-[var(--glass-border)] bg-[var(--midnight-700)] py-1 shadow-xl">
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-[var(--midnight-600)] hover:text-white"
          >
            <Copy className="h-3.5 w-3.5" />
            {copied ? "Copied!" : "Copy Address"}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              resetWallet();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--red)] transition-colors hover:bg-[var(--midnight-600)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Wallet
          </button>
        </div>
      )}
    </div>
  );
}
