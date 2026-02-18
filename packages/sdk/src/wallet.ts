/**
 * In-browser wallet generation and persistence.
 *
 * This module creates a lightweight wallet stored in localStorage so users
 * can interact with the DEX without installing a browser extension.
 * The mock key generation here will be replaced by real Midnight SDK calls
 * once the wallet-api package is integrated.
 */

const STORAGE_KEY = "midnight-dex-wallet";

/** Public wallet information safe to pass around the application. */
export interface DexWallet {
  coinPublicKey: string;
  encryptionPublicKey: string;
  /** Truncated display form of the address (e.g. "a1b2c3d4...ef56") */
  address: string;
  createdAt: number;
}

/**
 * Internal representation that includes secret key material.
 * This is persisted to localStorage but the secretKey is never
 * exposed through the public API.
 */
interface StoredWallet {
  coinPublicKey: string;
  encryptionPublicKey: string;
  secretKey: string;
  createdAt: number;
}

/**
 * Format a public key into a human-readable truncated address.
 * Shows the first 8 and last 4 characters with an ellipsis in between.
 */
function formatAddress(coinPublicKey: string): string {
  if (coinPublicKey.length <= 12) return coinPublicKey;
  return `${coinPublicKey.slice(0, 8)}...${coinPublicKey.slice(-4)}`;
}

/** Convert raw random bytes to a hex string. */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Generate a mock keypair using browser crypto.
 *
 * TODO: Replace with @midnight-ntwrk/wallet-api key derivation.
 * The real implementation would use:
 *   - `WalletBuilder.build()` to create a wallet instance
 *   - Derive coinPublicKey and encryptionPublicKey from the seed
 *   - Store the seed phrase rather than raw keys
 */
function generateMockKeypair(): StoredWallet {
  const secretKeyBytes = new Uint8Array(32);
  const coinKeyBytes = new Uint8Array(32);
  const encryptionKeyBytes = new Uint8Array(32);

  crypto.getRandomValues(secretKeyBytes);
  crypto.getRandomValues(coinKeyBytes);
  crypto.getRandomValues(encryptionKeyBytes);

  return {
    secretKey: bytesToHex(secretKeyBytes),
    coinPublicKey: bytesToHex(coinKeyBytes),
    encryptionPublicKey: bytesToHex(encryptionKeyBytes),
    createdAt: Date.now(),
  };
}

/**
 * Load an existing wallet from localStorage or create a new one.
 *
 * On first visit this generates a fresh keypair and persists it.
 * Subsequent calls return the stored wallet without regenerating keys.
 *
 * @returns The public wallet information, or `null` in SSR environments.
 */
export function loadOrCreateWallet(): DexWallet | null {
  // Guard against server-side rendering where localStorage is unavailable
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(STORAGE_KEY);

  if (stored) {
    const parsed: StoredWallet = JSON.parse(stored);
    return {
      coinPublicKey: parsed.coinPublicKey,
      encryptionPublicKey: parsed.encryptionPublicKey,
      address: formatAddress(parsed.coinPublicKey),
      createdAt: parsed.createdAt,
    };
  }

  const keypair = generateMockKeypair();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keypair));

  return {
    coinPublicKey: keypair.coinPublicKey,
    encryptionPublicKey: keypair.encryptionPublicKey,
    address: formatAddress(keypair.coinPublicKey),
    createdAt: keypair.createdAt,
  };
}

/** Remove the stored wallet, forcing a fresh keypair on next load. */
export function resetWallet(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Check whether a wallet already exists in localStorage. */
export function hasExistingWallet(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
