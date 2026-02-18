"use client";

/**
 * WalletBadge — shows the connected wallet address in a pill.
 *
 * This is a stub that displays a placeholder address. It will be
 * wired to the real WalletContext in a later task.
 */
export function WalletBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--glass-border)] bg-[var(--midnight-700)] px-3 py-1.5 text-sm">
      {/* Green dot indicates connected status */}
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      <span className="font-mono text-gray-300">0x3f8a...2e4c</span>
    </div>
  );
}
