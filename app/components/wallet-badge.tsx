"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, LogOut, ExternalLink, Loader2, Wallet } from "lucide-react";
import { useWallet } from "@/hooks/use-wallet";

const LACE_INSTALL_URL =
  "https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk";

/**
 * WalletBadge -- renders a wallet connection control in the header.
 *
 * Visual states:
 * - not-installed: link to install the Lace extension
 * - disconnected: "Connect Wallet" button
 * - connecting: spinner with "Connecting..." label
 * - connected: truncated address pill with Copy / Disconnect dropdown
 * - error: "Connection Failed" with a retry button
 */
export function WalletBadge() {
  const { state, connect, disconnect } = useWallet();
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

  // ── Not installed ──────────────────────────────────────────────────
  if (state.status === "not-installed") {
    return (
      <a
        href={LACE_INSTALL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--midnight-700)] px-3 py-1.5 text-sm text-gray-300 transition-colors hover:bg-[var(--midnight-600)] hover:text-white"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Install Lace
      </a>
    );
  }

  // ── Disconnected ───────────────────────────────────────────────────
  if (state.status === "disconnected") {
    return (
      <button
        type="button"
        onClick={connect}
        className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--accent)] px-4 py-1.5 text-sm font-medium text-white shadow-[0_0_20px_var(--accent-glow)] transition-colors hover:bg-[var(--accent-light)]"
      >
        <Wallet className="h-3.5 w-3.5" />
        Connect Wallet
      </button>
    );
  }

  // ── Connecting ─────────────────────────────────────────────────────
  if (state.status === "connecting") {
    return (
      <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--midnight-700)] px-3 py-1.5 text-sm">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
        <span className="text-gray-300">Connecting...</span>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────
  if (state.status === "error") {
    return (
      <button
        type="button"
        onClick={connect}
        className="flex items-center gap-2 rounded-full border border-[var(--red)]/50 bg-[var(--midnight-700)] px-3 py-1.5 text-sm text-[var(--red)] transition-colors hover:bg-[var(--midnight-600)]"
      >
        <span className="h-2 w-2 rounded-full bg-[var(--red)]" />
        Connection Failed -- Retry
      </button>
    );
  }

  // ── Connected ──────────────────────────────────────────────────────
  const { address } = state;
  const truncated =
    address.length > 16
      ? `${address.slice(0, 8)}...${address.slice(-6)}`
      : address;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(address);
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
        <span className="font-mono text-gray-300">{truncated}</span>
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
              disconnect();
            }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-[var(--red)] transition-colors hover:bg-[var(--midnight-600)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
