# Midnight DEX PoC Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a proof-of-concept DEX for the Midnight Foundation with trade and explore screens, automatic wallet generation, and test token funding.

**Architecture:** Monorepo (pnpm + turbo) with three workspace packages: `contracts/` (Compact smart contracts), `app/` (Next.js 15 frontend), and `packages/sdk/` (shared Midnight wallet/contract integration). Based on LunarSwap (OpenZeppelin/midnight-apps) patterns.

**Tech Stack:** Compact 0.28.0, Next.js 15, React 19, Tailwind CSS 4, shadcn/ui, TypeScript 5, pnpm 10, turbo, Node 22, @midnight-ntwrk/wallet-api, @midnight-ntwrk/compact-runtime.

**Reference repo:** https://github.com/OpenZeppelin/midnight-apps (LunarSwap)

---

## Phase 1: Monorepo Scaffold

### Task 1: Initialize root workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `.nvmrc`
- Create: `.gitignore`
- Create: `.npmrc`

**Step 1: Create root package.json**

```json
{
  "name": "midnight-example-dex",
  "version": "0.1.0",
  "private": true,
  "description": "Midnight Foundation Example DEX PoC",
  "scripts": {
    "build": "turbo run build",
    "build:contracts": "turbo run build --filter './contracts'",
    "build:app": "turbo run build --filter './app'",
    "dev": "turbo run dev --filter './app'",
    "test": "turbo run test",
    "compact": "turbo run compact --log-prefix=none",
    "compact:fast": "turbo run compact:fast"
  },
  "packageManager": "pnpm@10.4.1",
  "engines": {
    "node": "22.x"
  },
  "engineStrict": true,
  "devDependencies": {
    "@types/node": "^24.10.0",
    "turbo": "^2.6.0",
    "typescript": "^5.8.3"
  }
}
```

**Step 2: Create pnpm-workspace.yaml**

```yaml
packages:
  - "contracts"
  - "app"
  - "packages/*"
```

**Step 3: Create turbo.json**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "compact": {
      "outputs": ["src/artifacts/**"]
    },
    "compact:fast": {
      "outputs": ["src/artifacts/**"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Step 4: Create .nvmrc**

```
22
```

**Step 5: Create .gitignore**

```
node_modules/
.next/
dist/
.turbo/
*.tsbuildinfo
.env
.env.local
src/artifacts/
```

**Step 6: Create .npmrc**

```
auto-install-peers=true
```

**Step 7: Install dependencies**

Run: `pnpm install`
Expected: lockfile created, turbo installed

**Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml turbo.json .nvmrc .gitignore .npmrc pnpm-lock.yaml
git commit -m "chore: scaffold monorepo with pnpm workspaces and turbo"
```

---

### Task 2: Scaffold contracts package

**Files:**
- Create: `contracts/package.json`
- Create: `contracts/tsconfig.json`

**Step 1: Create contracts/package.json**

Reference LunarSwap's `contracts/package.json` for the compact-compiler script pattern. Key dependencies: `@midnight-ntwrk/compact-runtime`, `@midnight-ntwrk/midnight-js-network-id`, `@midnight-ntwrk/zswap`.

```json
{
  "name": "@midnight-dex/contracts",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "config": {
    "compactVersion": "+0.28.0",
    "artifactsOutDir": "src/artifacts",
    "artifactsStructure": "--hierarchical"
  },
  "scripts": {
    "compact": "compact-compiler $npm_package_config_compactVersion $npm_package_config_artifactsStructure --out $npm_package_config_artifactsOutDir",
    "compact:fast": "compact-compiler $npm_package_config_compactVersion --skip-zk $npm_package_config_artifactsStructure --out $npm_package_config_artifactsOutDir",
    "build": "compact-builder $npm_package_config_compactVersion $npm_package_config_artifactsStructure --out $npm_package_config_artifactsOutDir",
    "build:fast": "compact-builder $npm_package_config_compactVersion --skip-zk $npm_package_config_artifactsStructure --out $npm_package_config_artifactsOutDir",
    "test": "vitest run"
  },
  "dependencies": {
    "@midnight-ntwrk/compact-runtime": "0.14.0",
    "@midnight-ntwrk/midnight-js-network-id": "3.0.0",
    "@midnight-ntwrk/zswap": "4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.8.3",
    "vitest": "^3.1.4"
  }
}
```

> **Note for implementor:** The `compact-compiler` and `compact-builder` commands come from `@openzeppelin/compact-tools-cli` in LunarSwap. Check whether these are published to npm or if you need to vendor the tool. If not available, use `compactc` directly from the `@midnight-ntwrk/compact` npm package:
> ```
> "compact": "npx @midnight-ntwrk/compact@0.28.0 compile --out src/artifacts",
> "compact:fast": "npx @midnight-ntwrk/compact@0.28.0 compile --skip-zk --out src/artifacts"
> ```
> Use `@midnight-tooling:midnight-setup` skill to verify the correct compile command.

**Step 2: Create contracts/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "src/artifacts"]
}
```

**Step 3: Install contracts dependencies**

Run: `cd contracts && pnpm install`

**Step 4: Commit**

```bash
git add contracts/package.json contracts/tsconfig.json
git commit -m "chore: scaffold contracts package with Compact compiler config"
```

---

### Task 3: Scaffold SDK package

**Files:**
- Create: `packages/sdk/package.json`
- Create: `packages/sdk/tsconfig.json`
- Create: `packages/sdk/src/index.ts`

**Step 1: Create packages/sdk/package.json**

```json
{
  "name": "@midnight-dex/sdk",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@midnight-ntwrk/wallet-api": "5.0.0",
    "@midnight-ntwrk/dapp-connector-api": "4.0.0",
    "@midnight-ntwrk/ledger-v7": "7.0.0",
    "@midnight-ntwrk/compact-runtime": "0.14.0",
    "@midnight-dex/contracts": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.8.3"
  }
}
```

> **Note for implementor:** The `@midnight-ntwrk/*` package versions above match LunarSwap. Check availability on npm. Use `@midnight-tooling:versions` skill to verify current recommended versions. If packages are in a private registry, check LunarSwap's `.npmrc` for the registry URL.

**Step 2: Create packages/sdk/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create packages/sdk/src/index.ts**

```typescript
export {};
```

**Step 4: Install and commit**

Run: `pnpm install`

```bash
git add packages/sdk/
git commit -m "chore: scaffold SDK package for wallet and contract integration"
```

---

### Task 4: Scaffold Next.js frontend app

**Files:**
- Create: `app/` — via `create-next-app` or manual scaffolding

**Step 1: Scaffold Next.js app**

Run from repo root:
```bash
pnpm create next-app@latest app --typescript --tailwind --eslint=false --app --src-dir=false --import-alias="@/*" --turbopack --no-git
```

**Step 2: Add workspace dependency on SDK**

Edit `app/package.json` to add:
```json
{
  "dependencies": {
    "@midnight-dex/sdk": "workspace:*"
  }
}
```

**Step 3: Install and verify**

Run: `pnpm install && pnpm --filter app dev`
Expected: Next.js dev server starts on localhost:3000

**Step 4: Commit**

```bash
git add app/
git commit -m "chore: scaffold Next.js 15 frontend app"
```

---

## Phase 2: Smart Contracts

### Task 5: Add ShieldedFungibleToken contract (from LunarSwap)

**Files:**
- Create: `contracts/src/token/openzeppelin/Utils.compact`
- Create: `contracts/src/token/openzeppelin/ShieldedERC20.compact`
- Create: `contracts/src/token/ShieldedFungibleToken.compact`

**Step 1: Copy contracts from LunarSwap**

Copy these files exactly from https://github.com/OpenZeppelin/midnight-apps/tree/main/contracts/src/shielded-token:

- `openzeppelin/Utils.compact` → `contracts/src/token/openzeppelin/Utils.compact`
- `openzeppelin/ShieldedERC20.compact` → `contracts/src/token/openzeppelin/ShieldedERC20.compact`
- `ShieldedFungibleToken.compact` → `contracts/src/token/ShieldedFungibleToken.compact`

Update the import path in `ShieldedFungibleToken.compact` if the relative path to `openzeppelin/ShieldedERC20` changes.

These contracts use `pragma language_version >= 0.20.0;` — this is correct for compactc 0.28.0.

**Step 2: Verify compilation**

Run: `pnpm --filter @midnight-dex/contracts run compact:fast`
Expected: Artifacts generated in `contracts/src/artifacts/` without errors.

> **If compilation fails**, use `@compact-core:compilation-tooling` and `@midnight-tooling:midnight-debugging` skills to diagnose. The most likely issue is compiler availability — ensure `compactc` is accessible.

**Step 3: Commit**

```bash
git add contracts/src/token/
git commit -m "feat: add ShieldedFungibleToken contract from LunarSwap"
```

---

### Task 6: Write SimpleDEX rate oracle contract

**Files:**
- Create: `contracts/src/dex/SimpleDEX.compact`

**Step 1: Write the SimpleDEX contract**

This contract stores fixed exchange rates and provides a rate lookup circuit. The actual token operations (burn input, mint output) are orchestrated by the SDK as separate transactions — Midnight doesn't support cross-contract calls within a single transaction.

```compact
// SPDX-License-Identifier: MIT
// Midnight Example DEX - SimpleDEX Rate Oracle

pragma language_version >= 0.20.0;

import CompactStandardLibrary;

// Rate stored as: output_amount per 1 unit of input (scaled by 1e6 for precision)
// e.g., tMIDN→tUSDC rate of 1800 stored as 1_800_000_000
export ledger rates: Map<Bytes<32>, Uint<64>>;
export sealed ledger admin: Bytes<32>;

witness get_admin_key(): Bytes<32>;

// Create a pair key from two token identifiers
pure circuit pair_key(token_a: Bytes<32>, token_b: Bytes<32>): Bytes<32> {
  return persistentHash<Vector<2, Bytes<32>>>([token_a, token_b]);
}

constructor(admin_key: Bytes<32>) {
  admin = disclose(admin_key);
}

// Admin sets the exchange rate for a pair
export circuit set_rate(token_a: Bytes<32>, token_b: Bytes<32>, rate: Uint<64>): [] {
  const caller = get_admin_key();
  assert(disclose(caller == admin), "SimpleDEX: not admin");
  const key = pair_key(disclose(token_a), disclose(token_b));
  rates.insert(key, disclose(rate));
}

// Anyone can read the rate for a pair
export circuit get_rate(token_a: Bytes<32>, token_b: Bytes<32>): Uint<64> {
  const key = pair_key(disclose(token_a), disclose(token_b));
  assert(rates.member(key), "SimpleDEX: pair not found");
  return rates.lookup(key);
}
```

> **Note for implementor:** This contract may need syntax adjustments depending on compiler behavior. Use `@compact-core:language-reference` and `@compact-core:compact-lint` skills before compiling. Key things to verify:
> - `pure circuit` syntax for helper functions
> - `disclose()` on all circuit params that touch ledger
> - `Map` operations in circuits (lookup/member both work per syntax reference)
> - `persistentHash` usage for deterministic pair keys
>
> If the contract doesn't compile, simplify: remove the pair key hashing and use a simpler ledger structure (individual rate fields instead of a Map).

**Step 2: Verify compilation**

Run: `pnpm --filter @midnight-dex/contracts run compact:fast`
Expected: Artifacts generated for both token and dex contracts.

**Step 3: Commit**

```bash
git add contracts/src/dex/
git commit -m "feat: add SimpleDEX rate oracle contract"
```

---

### Task 7: Write contract tests for SimpleDEX

**Files:**
- Create: `contracts/vitest.config.ts`
- Create: `contracts/src/dex/test/SimpleDEX.test.ts`

**Step 1: Create vitest.config.ts**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60_000,
  },
});
```

**Step 2: Write test for rate setting and retrieval**

> **Note for implementor:** The test structure depends on the contract simulator tooling available. LunarSwap uses `@openzeppelin/compact-tools-simulator` (local file reference). If this isn't available, check if `@midnight-ntwrk/compact-runtime` provides a test harness, or use `@compact-core:testing-debugging` skill for the recommended test pattern.

```typescript
import { describe, it, expect } from "vitest";
// Import pattern depends on available tooling — adjust after compilation artifacts are generated
// import { SimpleDEX } from "../artifacts/dex/SimpleDEX";

describe("SimpleDEX", () => {
  it("should set and retrieve exchange rate", async () => {
    // 1. Deploy contract with admin key
    // 2. Call set_rate for tMIDN/tUSDC pair
    // 3. Call get_rate and verify returned rate matches
    expect(true).toBe(true); // placeholder until tooling is confirmed
  });

  it("should reject rate setting from non-admin", async () => {
    // 1. Deploy contract with admin key A
    // 2. Call set_rate with different key B
    // 3. Expect assertion failure
    expect(true).toBe(true);
  });

  it("should reject rate lookup for unknown pair", async () => {
    // 1. Deploy contract
    // 2. Call get_rate for a pair that hasn't been set
    // 3. Expect assertion failure "pair not found"
    expect(true).toBe(true);
  });
});
```

> **Note for implementor:** Replace placeholder tests with actual contract simulator calls once the tooling is confirmed. The test patterns will follow whatever simulator API is available. Use `@compact-core:testing-debugging` skill for guidance.

**Step 3: Run tests**

Run: `pnpm --filter @midnight-dex/contracts test`
Expected: Tests pass (placeholders for now)

**Step 4: Commit**

```bash
git add contracts/vitest.config.ts contracts/src/dex/test/
git commit -m "test: add SimpleDEX contract test scaffolding"
```

---

## Phase 3: SDK Package

### Task 8: Implement wallet generation

**Files:**
- Create: `packages/sdk/src/wallet.ts`
- Modify: `packages/sdk/src/index.ts`

**Step 1: Write wallet generation module**

```typescript
// packages/sdk/src/wallet.ts

const STORAGE_KEY = "midnight-dex-wallet";

export interface DexWallet {
  coinPublicKey: string;
  encryptionPublicKey: string;
  address: string;
  createdAt: number;
}

interface StoredWallet {
  coinPublicKey: string;
  encryptionPublicKey: string;
  secretKey: string;
  createdAt: number;
}

/**
 * Generate a new in-browser wallet or load existing from localStorage.
 *
 * NOTE FOR IMPLEMENTOR: The actual key generation depends on the
 * @midnight-ntwrk/wallet-api package exports. Check the API surface:
 *
 * - If it provides a `generateKeyPair()` or similar function, use that
 * - If it requires connecting to a node, we may need to use crypto.getRandomValues()
 *   to generate keys and then derive the public key format Midnight expects
 * - Use @midnight-dapp:wallet-integration skill for the exact API
 *
 * The implementation below is a structural scaffold — replace the key generation
 * with the actual SDK calls.
 */
export function loadOrCreateWallet(): DexWallet {
  if (typeof window === "undefined") {
    throw new Error("Wallet can only be used in browser");
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed: StoredWallet = JSON.parse(stored);
      return {
        coinPublicKey: parsed.coinPublicKey,
        encryptionPublicKey: parsed.encryptionPublicKey,
        address: `${parsed.coinPublicKey.slice(0, 8)}...${parsed.coinPublicKey.slice(-4)}`,
        createdAt: parsed.createdAt,
      };
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  // TODO: Replace with actual @midnight-ntwrk/wallet-api key generation
  const keyBytes = new Uint8Array(32);
  crypto.getRandomValues(keyBytes);
  const secretKey = Array.from(keyBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // TODO: Derive actual Midnight public keys from secret key
  const coinPublicKey = `pk_${secretKey.slice(0, 60)}`;
  const encryptionPublicKey = `epk_${secretKey.slice(0, 58)}`;

  const wallet: StoredWallet = {
    coinPublicKey,
    encryptionPublicKey,
    secretKey,
    createdAt: Date.now(),
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(wallet));

  return {
    coinPublicKey: wallet.coinPublicKey,
    encryptionPublicKey: wallet.encryptionPublicKey,
    address: `${wallet.coinPublicKey.slice(0, 8)}...${wallet.coinPublicKey.slice(-4)}`,
    createdAt: wallet.createdAt,
  };
}

export function resetWallet(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function hasExistingWallet(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
```

**Step 2: Export from index**

```typescript
// packages/sdk/src/index.ts
export { loadOrCreateWallet, resetWallet, hasExistingWallet } from "./wallet";
export type { DexWallet } from "./wallet";
```

**Step 3: Build and commit**

Run: `pnpm --filter @midnight-dex/sdk build`

```bash
git add packages/sdk/src/
git commit -m "feat: add in-browser wallet generation with localStorage persistence"
```

---

### Task 9: Implement contract interaction helpers

**Files:**
- Create: `packages/sdk/src/contracts.ts`
- Create: `packages/sdk/src/config.ts`

**Step 1: Create contract config**

```typescript
// packages/sdk/src/config.ts

export interface TokenConfig {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  icon: string;
}

export interface DexConfig {
  networkId: string;
  rpcUrl: string;
  indexerUrl: string;
  dexContractAddress: string;
  tokens: TokenConfig[];
}

// These addresses will be populated after testnet deployment
// For development, these are placeholders
export const DEFAULT_CONFIG: DexConfig = {
  networkId: "testnet",
  rpcUrl: "https://rpc.testnet.midnight.network",
  indexerUrl: "https://indexer.testnet.midnight.network",
  dexContractAddress: "0x_DEX_CONTRACT_ADDRESS_PLACEHOLDER",
  tokens: [
    {
      name: "Midnight",
      symbol: "tMIDN",
      address: "0x_TMIDN_ADDRESS_PLACEHOLDER",
      decimals: 18,
      icon: "/tokens/tmidn.svg",
    },
    {
      name: "USD Coin",
      symbol: "tUSDC",
      address: "0x_TUSDC_ADDRESS_PLACEHOLDER",
      decimals: 18,
      icon: "/tokens/tusdc.svg",
    },
    {
      name: "Bitcoin",
      symbol: "tBTC",
      address: "0x_TBTC_ADDRESS_PLACEHOLDER",
      decimals: 18,
      icon: "/tokens/tbtc.svg",
    },
  ],
};
```

**Step 2: Create contract interaction module**

```typescript
// packages/sdk/src/contracts.ts

import { DEFAULT_CONFIG, type DexConfig, type TokenConfig } from "./config";

export type SwapStatus =
  | "idle"
  | "building"
  | "proving"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

export interface SwapResult {
  status: SwapStatus;
  txHash?: string;
  error?: string;
  inputAmount: string;
  outputAmount: string;
}

/**
 * Get the exchange rate for a token pair.
 *
 * NOTE FOR IMPLEMENTOR: In the real implementation, this reads from the
 * SimpleDEX contract's ledger state. For initial development, return
 * hardcoded rates. Replace with actual contract reads once deployment is done.
 * Use @midnight-dapp:state-management skill for reading ledger state.
 */
export function getExchangeRate(
  fromSymbol: string,
  toSymbol: string,
  _config: DexConfig = DEFAULT_CONFIG,
): number {
  const rates: Record<string, Record<string, number>> = {
    tMIDN: { tUSDC: 1800, tBTC: 0.02667 },
    tUSDC: { tMIDN: 0.000556, tBTC: 0.0000148 },
    tBTC: { tMIDN: 37.5, tUSDC: 67500 },
  };
  return rates[fromSymbol]?.[toSymbol] ?? 0;
}

/**
 * Calculate swap output amount given input.
 */
export function calculateSwapOutput(
  inputAmount: number,
  fromSymbol: string,
  toSymbol: string,
): number {
  const rate = getExchangeRate(fromSymbol, toSymbol);
  return inputAmount * rate;
}

/**
 * Execute a swap transaction.
 *
 * NOTE FOR IMPLEMENTOR: The full swap flow is:
 * 1. Read rate from SimpleDEX contract
 * 2. Build burn transaction for input token
 * 3. Generate ZK proof for burn
 * 4. Submit burn transaction
 * 5. Build mint transaction for output token
 * 6. Generate ZK proof for mint
 * 7. Submit mint transaction
 *
 * This requires @midnight-ntwrk/compact-runtime for transaction building
 * and the compiled contract artifacts. Use @midnight-dapp:transaction-flows
 * and @midnight-dapp:proof-handling skills for implementation.
 *
 * For initial frontend development, this returns a mock result after a delay.
 */
export async function executeSwap(
  fromToken: TokenConfig,
  toToken: TokenConfig,
  inputAmount: number,
  onStatusChange: (status: SwapStatus) => void,
): Promise<SwapResult> {
  const outputAmount = calculateSwapOutput(
    inputAmount,
    fromToken.symbol,
    toToken.symbol,
  );

  try {
    onStatusChange("building");
    await delay(500);

    onStatusChange("proving");
    await delay(2000); // Simulate proof generation

    onStatusChange("submitting");
    await delay(1000);

    onStatusChange("confirming");
    await delay(1500);

    onStatusChange("success");
    return {
      status: "success",
      txHash: `0x${randomHex(64)}`,
      inputAmount: inputAmount.toString(),
      outputAmount: outputAmount.toFixed(6),
    };
  } catch (err) {
    onStatusChange("error");
    return {
      status: "error",
      error: err instanceof Error ? err.message : "Swap failed",
      inputAmount: inputAmount.toString(),
      outputAmount: "0",
    };
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomHex(length: number): string {
  const bytes = new Uint8Array(length / 2);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
```

**Step 3: Export from index**

Update `packages/sdk/src/index.ts`:
```typescript
export { loadOrCreateWallet, resetWallet, hasExistingWallet } from "./wallet";
export type { DexWallet } from "./wallet";
export { getExchangeRate, calculateSwapOutput, executeSwap } from "./contracts";
export type { SwapStatus, SwapResult } from "./contracts";
export { DEFAULT_CONFIG } from "./config";
export type { TokenConfig, DexConfig } from "./config";
```

**Step 4: Build and commit**

Run: `pnpm --filter @midnight-dex/sdk build`

```bash
git add packages/sdk/src/
git commit -m "feat: add contract interaction helpers with mock swap execution"
```

---

### Task 10: Implement auto-funding module

**Files:**
- Create: `packages/sdk/src/funding.ts`
- Modify: `packages/sdk/src/index.ts`

**Step 1: Write funding module**

```typescript
// packages/sdk/src/funding.ts

import { DEFAULT_CONFIG, type DexConfig } from "./config";
import type { DexWallet } from "./wallet";

export type FundingStep =
  | "checking"
  | "funding-gas"
  | "minting-tokens"
  | "complete"
  | "error";

export interface FundingStatus {
  step: FundingStep;
  message: string;
  progress: number; // 0-100
}

export interface TokenBalance {
  symbol: string;
  balance: string;
  formatted: string;
}

/**
 * Check token balances for the wallet.
 *
 * NOTE FOR IMPLEMENTOR: Replace with actual ledger state reads.
 * Use @midnight-dapp:state-management skill for querying contract state.
 * Balance comes from the zswap coin infrastructure — you'll need to query
 * the user's unspent coins filtered by token color/type.
 */
export async function getBalances(
  _wallet: DexWallet,
  config: DexConfig = DEFAULT_CONFIG,
): Promise<TokenBalance[]> {
  return config.tokens.map((token) => ({
    symbol: token.symbol,
    balance: "0",
    formatted: "0.00",
  }));
}

/**
 * Fund a new wallet with gas tokens and test tokens.
 *
 * Flow:
 * 1. Request tDUSK from testnet faucet
 * 2. Call mint() on each token contract
 *
 * NOTE FOR IMPLEMENTOR:
 * - Testnet faucet: Check Midnight docs for faucet API endpoint
 *   Use @midnight-tooling:midnight-setup skill for faucet details
 * - Token minting: Call the mint() circuit on each ShieldedFungibleToken
 *   deployment. The mint is permissionless (no access control).
 *   Use @midnight-dapp:transaction-flows skill for building mint transactions
 *
 * For initial development, this simulates the funding flow.
 */
export async function fundWallet(
  _wallet: DexWallet,
  onStatus: (status: FundingStatus) => void,
  _config: DexConfig = DEFAULT_CONFIG,
): Promise<boolean> {
  try {
    onStatus({
      step: "checking",
      message: "Checking balances...",
      progress: 0,
    });
    await delay(500);

    onStatus({
      step: "funding-gas",
      message: "Requesting testnet gas tokens...",
      progress: 25,
    });
    await delay(2000);

    onStatus({
      step: "minting-tokens",
      message: "Minting tMIDN...",
      progress: 40,
    });
    await delay(1500);

    onStatus({
      step: "minting-tokens",
      message: "Minting tUSDC...",
      progress: 60,
    });
    await delay(1500);

    onStatus({
      step: "minting-tokens",
      message: "Minting tBTC...",
      progress: 80,
    });
    await delay(1500);

    onStatus({
      step: "complete",
      message: "Wallet funded!",
      progress: 100,
    });

    return true;
  } catch (err) {
    onStatus({
      step: "error",
      message: err instanceof Error ? err.message : "Funding failed",
      progress: 0,
    });
    return false;
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

**Step 2: Update index exports**

Add to `packages/sdk/src/index.ts`:
```typescript
export { getBalances, fundWallet } from "./funding";
export type { FundingStep, FundingStatus, TokenBalance } from "./funding";
```

**Step 3: Build and commit**

Run: `pnpm --filter @midnight-dex/sdk build`

```bash
git add packages/sdk/src/
git commit -m "feat: add wallet auto-funding module with mock testnet funding"
```

---

## Phase 4: Frontend — Foundation

### Task 11: Configure Tailwind and Midnight brand theme

**Files:**
- Modify: `app/tailwind.config.ts` (or `app/globals.css` depending on Tailwind 4 setup)
- Modify: `app/app/globals.css`
- Modify: `app/app/layout.tsx`

**Step 1: Configure Midnight brand colors**

The exact approach depends on whether `create-next-app` scaffolded Tailwind 3 or 4. For Tailwind 4 (CSS-first config), add custom properties in `globals.css`. For Tailwind 3, extend `tailwind.config.ts`.

Custom design tokens:
```css
/* Midnight brand palette */
--color-midnight-900: #0a0e1a;
--color-midnight-800: #0f1525;
--color-midnight-700: #141928;
--color-midnight-600: #1e2438;
--color-midnight-500: #2a3150;

--color-accent: #7c3aed;       /* Purple primary */
--color-accent-light: #a78bfa;  /* Purple hover/light */
--color-accent-glow: #7c3aed33; /* Purple glow for glass effects */

--color-teal: #06b6d4;          /* Positive/gain values */
--color-red: #ef4444;           /* Negative/loss values */

--color-glass-bg: rgba(20, 25, 40, 0.6);
--color-glass-border: rgba(167, 139, 250, 0.15);
```

**Step 2: Set up dark-only layout**

Update `app/app/layout.tsx` — strip the default Next.js boilerplate. Set `<html className="dark">` since this is a dark-only theme. Remove the default light mode styles.

**Step 3: Verify**

Run: `pnpm --filter app dev`
Expected: Dark background renders at localhost:3000

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: configure Midnight brand theme with dark palette"
```

---

### Task 12: Install and configure shadcn/ui

**Files:**
- Modify: `app/` — shadcn init and component additions

**Step 1: Initialize shadcn/ui**

Run from `app/`:
```bash
pnpm dlx shadcn@latest init
```

Select: New York style, Zinc base color (we override with Midnight colors).

**Step 2: Add required components**

```bash
pnpm dlx shadcn@latest add button card dialog select tabs tooltip toast
```

**Step 3: Verify components are installed**

Check that `app/components/ui/` contains the added components.

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: add shadcn/ui components (button, card, dialog, select, tabs, tooltip, toast)"
```

---

### Task 13: Create app shell with header and navigation

**Files:**
- Create: `app/components/header.tsx`
- Create: `app/components/wallet-badge.tsx`
- Create: `app/components/nav-tabs.tsx`
- Modify: `app/app/layout.tsx`
- Modify: `app/app/page.tsx`
- Create: `app/app/trade/page.tsx`
- Create: `app/app/explore/page.tsx`

**Step 1: Create header component**

```tsx
// app/components/header.tsx
import { NavTabs } from "./nav-tabs";
import { WalletBadge } from "./wallet-badge";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <span className="text-lg font-bold text-white">MidnightDEX</span>
          <NavTabs />
        </div>
        <WalletBadge />
      </div>
    </header>
  );
}
```

**Step 2: Create nav tabs**

```tsx
// app/components/nav-tabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/trade", label: "Trade" },
  { href: "/explore", label: "Explore" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            pathname === tab.href
              ? "bg-[var(--color-accent)] text-white"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
```

**Step 3: Create wallet badge (placeholder)**

```tsx
// app/components/wallet-badge.tsx
"use client";

export function WalletBadge() {
  return (
    <div className="flex items-center gap-2 rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] px-3 py-1.5">
      <div className="h-2 w-2 rounded-full bg-[var(--color-teal)]" />
      <span className="text-sm text-gray-300">0x3f8a...2e4c</span>
    </div>
  );
}
```

**Step 4: Create page stubs**

Root page redirects to trade:
```tsx
// app/app/page.tsx
import { redirect } from "next/navigation";
export default function Home() {
  redirect("/trade");
}
```

Trade page stub:
```tsx
// app/app/trade/page.tsx
export default function TradePage() {
  return (
    <main className="container mx-auto px-4 pt-24">
      <div className="mx-auto max-w-md">
        <p className="text-gray-400">Trade screen — swap card goes here</p>
      </div>
    </main>
  );
}
```

Explore page stub:
```tsx
// app/app/explore/page.tsx
export default function ExplorePage() {
  return (
    <main className="container mx-auto px-4 pt-24">
      <p className="text-gray-400">Explore screen — token table goes here</p>
    </main>
  );
}
```

**Step 5: Update layout to include header**

Modify `app/app/layout.tsx` to wrap children with the Header component and apply the Midnight background:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MidnightDEX",
  description: "Midnight Foundation Example DEX",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} min-h-screen bg-[var(--color-midnight-900)] text-white`}
      >
        <Header />
        {children}
      </body>
    </html>
  );
}
```

**Step 6: Verify**

Run: `pnpm --filter app dev`
Expected: Header with logo, nav tabs, and wallet badge renders. Clicking Trade/Explore navigates between routes.

**Step 7: Commit**

```bash
git add app/
git commit -m "feat: add app shell with header, navigation, and page routing"
```

---

## Phase 5: Frontend — Trade Screen

### Task 14: Create TokenSelector component

**Files:**
- Create: `app/components/token-selector.tsx`

**Step 1: Build the token selector dropdown**

A dropdown that shows available tokens with their icons and balances. Uses shadcn Select component.

```tsx
// app/components/token-selector.tsx
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Token {
  symbol: string;
  name: string;
  icon: string;
  balance: string;
}

interface TokenSelectorProps {
  tokens: Token[];
  selected: Token;
  onSelect: (symbol: string) => void;
  disabled?: boolean;
}

export function TokenSelector({
  tokens,
  selected,
  onSelect,
  disabled,
}: TokenSelectorProps) {
  return (
    <Select value={selected.symbol} onValueChange={onSelect} disabled={disabled}>
      <SelectTrigger className="w-[140px] border-[var(--color-glass-border)] bg-[var(--color-midnight-600)]">
        <SelectValue>
          <span className="font-medium">{selected.symbol}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="border-[var(--color-glass-border)] bg-[var(--color-midnight-700)]">
        {tokens.map((token) => (
          <SelectItem key={token.symbol} value={token.symbol}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{token.symbol}</span>
              <span className="text-xs text-gray-400">{token.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

**Step 2: Commit**

```bash
git add app/components/token-selector.tsx
git commit -m "feat: add TokenSelector dropdown component"
```

---

### Task 15: Create SwapCard component

**Files:**
- Create: `app/components/swap-card.tsx`
- Modify: `app/app/trade/page.tsx`

**Step 1: Build the swap card**

This is the core trading UI. It has two token inputs (from/to), a swap direction toggle, rate display, and a contextual swap button.

```tsx
// app/components/swap-card.tsx
"use client";

import { ArrowDownUp } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { TokenSelector } from "./token-selector";
import { calculateSwapOutput, getExchangeRate } from "@midnight-dex/sdk";
import type { SwapStatus } from "@midnight-dex/sdk";

const TOKENS = [
  { symbol: "tMIDN", name: "Midnight", icon: "/tokens/tmidn.svg", balance: "1,000.00" },
  { symbol: "tUSDC", name: "USD Coin", icon: "/tokens/tusdc.svg", balance: "5,000.00" },
  { symbol: "tBTC", name: "Bitcoin", icon: "/tokens/tbtc.svg", balance: "0.5000" },
];

const STATUS_LABELS: Record<SwapStatus, string> = {
  idle: "Swap",
  building: "Building transaction...",
  proving: "Generating proof...",
  submitting: "Submitting...",
  confirming: "Confirming...",
  success: "Swap complete!",
  error: "Swap failed",
};

export function SwapCard() {
  const [fromSymbol, setFromSymbol] = useState("tMIDN");
  const [toSymbol, setToSymbol] = useState("tUSDC");
  const [fromAmount, setFromAmount] = useState("");
  const [swapStatus, setSwapStatus] = useState<SwapStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const fromToken = TOKENS.find((t) => t.symbol === fromSymbol)!;
  const toToken = TOKENS.find((t) => t.symbol === toSymbol)!;

  const rate = useMemo(
    () => getExchangeRate(fromSymbol, toSymbol),
    [fromSymbol, toSymbol],
  );

  const toAmount = useMemo(() => {
    const input = parseFloat(fromAmount);
    if (isNaN(input) || input <= 0) return "";
    return calculateSwapOutput(input, fromSymbol, toSymbol).toFixed(6);
  }, [fromAmount, fromSymbol, toSymbol]);

  const handleFlip = useCallback(() => {
    setFromSymbol(toSymbol);
    setToSymbol(fromSymbol);
    setFromAmount("");
  }, [fromSymbol, toSymbol]);

  const handleSwap = useCallback(async () => {
    setError(null);
    const { executeSwap } = await import("@midnight-dex/sdk");
    const fromTokenConfig = { name: fromToken.name, symbol: fromToken.symbol, address: "", decimals: 18, icon: fromToken.icon };
    const toTokenConfig = { name: toToken.name, symbol: toToken.symbol, address: "", decimals: 18, icon: toToken.icon };
    const result = await executeSwap(
      fromTokenConfig,
      toTokenConfig,
      parseFloat(fromAmount),
      setSwapStatus,
    );
    if (result.status === "error") {
      setError(result.error ?? "Unknown error");
    }
    setTimeout(() => setSwapStatus("idle"), 3000);
  }, [fromToken, toToken, fromAmount]);

  const isSwapping = swapStatus !== "idle" && swapStatus !== "success" && swapStatus !== "error";

  return (
    <Card className="border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] backdrop-blur-xl">
      <CardHeader>
        <h2 className="text-xl font-semibold text-white">Swap</h2>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* From input */}
        <div className="rounded-xl bg-[var(--color-midnight-700)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">You pay</span>
            <span className="text-xs text-gray-500">
              Balance: {fromToken.balance}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.00"
              disabled={isSwapping}
              className="flex-1 bg-transparent text-2xl font-medium text-white outline-none placeholder:text-gray-600 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <TokenSelector
              tokens={TOKENS.filter((t) => t.symbol !== toSymbol)}
              selected={fromToken}
              onSelect={setFromSymbol}
              disabled={isSwapping}
            />
          </div>
        </div>

        {/* Flip button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full bg-[var(--color-midnight-600)] hover:bg-[var(--color-midnight-500)]"
            onClick={handleFlip}
            disabled={isSwapping}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* To input */}
        <div className="rounded-xl bg-[var(--color-midnight-700)] p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-gray-400">You receive</span>
            <span className="text-xs text-gray-500">
              Balance: {toToken.balance}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.00"
              className="flex-1 bg-transparent text-2xl font-medium text-white outline-none placeholder:text-gray-600"
            />
            <TokenSelector
              tokens={TOKENS.filter((t) => t.symbol !== fromSymbol)}
              selected={toToken}
              onSelect={setToSymbol}
              disabled={isSwapping}
            />
          </div>
        </div>

        {/* Rate display */}
        {fromAmount && rate > 0 && (
          <div className="text-sm text-gray-400">
            1 {fromSymbol} = {rate.toLocaleString()} {toSymbol}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {error && (
          <p className="w-full text-sm text-[var(--color-red)]">{error}</p>
        )}
        <Button
          className="w-full bg-[var(--color-accent)] py-6 text-white hover:bg-[var(--color-accent-light)]"
          disabled={!fromAmount || parseFloat(fromAmount) <= 0 || isSwapping}
          onClick={handleSwap}
        >
          {STATUS_LABELS[swapStatus]}
        </Button>
      </CardFooter>
    </Card>
  );
}
```

**Step 2: Update trade page**

```tsx
// app/app/trade/page.tsx
import { SwapCard } from "@/components/swap-card";

export default function TradePage() {
  return (
    <main className="container mx-auto px-4 pt-24">
      <div className="mx-auto max-w-md">
        <SwapCard />
      </div>
    </main>
  );
}
```

**Step 3: Verify**

Run: `pnpm --filter app dev`
Expected: Swap card renders with token selectors, amount inputs, flip button, and rate display. Clicking Swap runs through the mock status stages.

**Step 4: Commit**

```bash
git add app/components/swap-card.tsx app/app/trade/page.tsx
git commit -m "feat: add SwapCard component with mock swap execution flow"
```

---

## Phase 6: Frontend — Explore Screen

### Task 16: Create TokenTable component

**Files:**
- Create: `app/components/token-table.tsx`
- Modify: `app/app/explore/page.tsx`

**Step 1: Build the token listings table**

```tsx
// app/components/token-table.tsx
"use client";

import { useRouter } from "next/navigation";

interface TokenPair {
  from: string;
  to: string;
  price: string;
  change24h: number;
  volume: string;
}

const PAIRS: TokenPair[] = [
  { from: "tMIDN", to: "tUSDC", price: "$1,800.00", change24h: 2.4, volume: "$1.2M" },
  { from: "tBTC", to: "tUSDC", price: "$67,500.00", change24h: -0.8, volume: "$4.5M" },
  { from: "tBTC", to: "tMIDN", price: "37.50", change24h: 1.1, volume: "$890K" },
];

export function TokenTable() {
  const router = useRouter();

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-glass-border)] bg-[var(--color-glass-bg)] backdrop-blur-xl">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-glass-border)]">
            <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">
              Pair
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
              Price
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
              24h Change
            </th>
            <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">
              Volume
            </th>
          </tr>
        </thead>
        <tbody>
          {PAIRS.map((pair) => (
            <tr
              key={`${pair.from}-${pair.to}`}
              className="cursor-pointer border-b border-[var(--color-glass-border)] transition-colors last:border-0 hover:bg-[var(--color-midnight-600)]"
              onClick={() =>
                router.push(`/trade?from=${pair.from}&to=${pair.to}`)
              }
            >
              <td className="px-6 py-4">
                <span className="font-medium text-white">
                  {pair.from}/{pair.to}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-medium text-white">
                {pair.price}
              </td>
              <td className="px-6 py-4 text-right">
                <span
                  className={
                    pair.change24h >= 0
                      ? "text-[var(--color-teal)]"
                      : "text-[var(--color-red)]"
                  }
                >
                  {pair.change24h >= 0 ? "+" : ""}
                  {pair.change24h.toFixed(1)}%
                </span>
              </td>
              <td className="px-6 py-4 text-right text-gray-300">
                {pair.volume}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

**Step 2: Update explore page**

```tsx
// app/app/explore/page.tsx
import { TokenTable } from "@/components/token-table";

export default function ExplorePage() {
  return (
    <main className="container mx-auto px-4 pt-24">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-6 text-2xl font-bold text-white">Explore Tokens</h1>
        <TokenTable />
      </div>
    </main>
  );
}
```

**Step 3: Wire up trade page to accept query params**

Update `app/components/swap-card.tsx` to read `from` and `to` from URL search params using `useSearchParams()` to pre-select the pair when navigating from the explore table.

**Step 4: Verify**

Run: `pnpm --filter app dev`
Expected: Explore page shows token table. Clicking a row navigates to `/trade?from=X&to=Y` and the swap card pre-selects that pair.

**Step 5: Commit**

```bash
git add app/components/token-table.tsx app/app/explore/page.tsx app/components/swap-card.tsx
git commit -m "feat: add Explore screen with token listings table"
```

---

## Phase 7: Wallet & Onboarding

### Task 17: Create WalletContext provider

**Files:**
- Create: `app/lib/wallet-context.tsx`
- Create: `app/hooks/use-wallet.ts`
- Modify: `app/app/layout.tsx`

**Step 1: Create wallet context**

```tsx
// app/lib/wallet-context.tsx
"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import {
  loadOrCreateWallet,
  resetWallet as resetWalletSdk,
  hasExistingWallet,
  type DexWallet,
  type FundingStatus,
} from "@midnight-dex/sdk";

export interface WalletContextType {
  wallet: DexWallet | null;
  isLoading: boolean;
  isOnboarding: boolean;
  fundingStatus: FundingStatus | null;
  resetWallet: () => void;
}

export const WalletContext = createContext<WalletContextType | undefined>(
  undefined,
);

export function WalletProvider({ children }: PropsWithChildren) {
  const [wallet, setWallet] = useState<DexWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [fundingStatus, setFundingStatus] = useState<FundingStatus | null>(
    null,
  );

  useEffect(() => {
    const isExisting = hasExistingWallet();
    const w = loadOrCreateWallet();
    setWallet(w);

    if (!isExisting) {
      // New wallet — trigger onboarding
      setIsOnboarding(true);
      import("@midnight-dex/sdk").then(({ fundWallet }) => {
        fundWallet(w, setFundingStatus).then((success) => {
          if (success) {
            setTimeout(() => setIsOnboarding(false), 1500);
          }
        });
      });
    }

    setIsLoading(false);
  }, []);

  const handleReset = useCallback(() => {
    resetWalletSdk();
    setWallet(null);
    setIsOnboarding(true);
    const w = loadOrCreateWallet();
    setWallet(w);
    import("@midnight-dex/sdk").then(({ fundWallet }) => {
      fundWallet(w, setFundingStatus).then((success) => {
        if (success) {
          setTimeout(() => setIsOnboarding(false), 1500);
        }
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      wallet,
      isLoading,
      isOnboarding,
      fundingStatus,
      resetWallet: handleReset,
    }),
    [wallet, isLoading, isOnboarding, fundingStatus, handleReset],
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
```

**Step 2: Create useWallet hook**

```typescript
// app/hooks/use-wallet.ts
"use client";

import { useContext } from "react";
import { WalletContext, type WalletContextType } from "@/lib/wallet-context";

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
```

**Step 3: Wrap layout with WalletProvider**

Update `app/app/layout.tsx` to wrap children:
```tsx
<WalletProvider>
  <Header />
  {children}
</WalletProvider>
```

**Step 4: Commit**

```bash
git add app/lib/wallet-context.tsx app/hooks/use-wallet.ts app/app/layout.tsx
git commit -m "feat: add WalletContext with auto-generation and funding"
```

---

### Task 18: Create OnboardingOverlay component

**Files:**
- Create: `app/components/onboarding-overlay.tsx`
- Modify: `app/app/layout.tsx`

**Step 1: Build the onboarding overlay**

```tsx
// app/components/onboarding-overlay.tsx
"use client";

import { useWallet } from "@/hooks/use-wallet";

export function OnboardingOverlay() {
  const { isOnboarding, fundingStatus } = useWallet();

  if (!isOnboarding) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-midnight-900)]/95 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-[var(--color-glass-border)] bg-[var(--color-midnight-700)] p-8 text-center">
        <h2 className="mb-6 text-xl font-bold text-white">
          Setting up your wallet
        </h2>

        {fundingStatus && (
          <>
            <div className="mb-4">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-midnight-500)]">
                <div
                  className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                  style={{ width: `${fundingStatus.progress}%` }}
                />
              </div>
            </div>
            <p className="text-sm text-gray-400">{fundingStatus.message}</p>
          </>
        )}

        <p className="mt-6 text-xs text-gray-500">
          This is a demo wallet with testnet tokens.
        </p>
      </div>
    </div>
  );
}
```

**Step 2: Add to layout**

Add `<OnboardingOverlay />` inside the WalletProvider in `layout.tsx`.

**Step 3: Verify**

Run: `pnpm --filter app dev`
Expected: On first visit (clear localStorage), the onboarding overlay appears with progress bar. After ~8 seconds it dismisses and the app is usable.

**Step 4: Commit**

```bash
git add app/components/onboarding-overlay.tsx app/app/layout.tsx
git commit -m "feat: add onboarding overlay with wallet funding progress"
```

---

### Task 19: Wire up WalletBadge to real wallet context

**Files:**
- Modify: `app/components/wallet-badge.tsx`

**Step 1: Connect wallet badge to context**

Update `wallet-badge.tsx` to use the `useWallet` hook, display the real wallet address, and add a reset wallet button in a dropdown.

The badge should:
- Show a green dot + truncated address when wallet exists
- Show "Loading..." during hydration
- Include a dropdown with "Copy Address" and "Reset Wallet" options (use shadcn Dialog for reset confirmation)

**Step 2: Verify**

Run: `pnpm --filter app dev`
Expected: Wallet badge shows generated address. Clicking opens dropdown. "Reset Wallet" triggers onboarding again.

**Step 3: Commit**

```bash
git add app/components/wallet-badge.tsx
git commit -m "feat: wire wallet badge to context with copy and reset actions"
```

---

## Phase 8: Integration & Polish

### Task 20: Wire SwapCard to wallet balances

**Files:**
- Modify: `app/components/swap-card.tsx`

**Step 1: Replace hardcoded balances with wallet context**

Update `SwapCard` to:
- Read balances from wallet context (for now, use mock balances from the SDK's initial funding amounts: 1000 tMIDN, 5000 tUSDC, 0.5 tBTC)
- Validate that the input amount doesn't exceed balance
- Show "Insufficient balance" on the swap button if exceeded
- After a successful mock swap, update the displayed balances

**Step 2: Commit**

```bash
git add app/components/swap-card.tsx
git commit -m "feat: wire swap card to wallet balances with validation"
```

---

### Task 21: Wire Explore table to navigate with pair pre-selection

**Files:**
- Modify: `app/components/swap-card.tsx`

**Step 1: Read URL search params**

The SwapCard already receives query params from the explore table navigation. Ensure `useSearchParams()` correctly initializes `fromSymbol` and `toSymbol` from `?from=X&to=Y`.

Use `useSearchParams` from `next/navigation`. Handle the case where params are not provided (default to tMIDN/tUSDC).

**Step 2: Verify full flow**

1. Go to `/explore`
2. Click the tBTC/tUSDC row
3. Redirects to `/trade?from=tBTC&to=tUSDC`
4. Swap card shows tBTC → tUSDC pre-selected

**Step 3: Commit**

```bash
git add app/components/swap-card.tsx
git commit -m "feat: support pair pre-selection from explore screen navigation"
```

---

### Task 22: Add token icon SVGs

**Files:**
- Create: `app/public/tokens/tmidn.svg`
- Create: `app/public/tokens/tusdc.svg`
- Create: `app/public/tokens/tbtc.svg`

**Step 1: Create simple token icons**

Create minimal SVG icons for each token. These can be simple colored circles with the first letter:
- tMIDN: Purple circle with "M"
- tUSDC: Green circle with "$"
- tBTC: Orange circle with "B"

**Step 2: Wire icons into TokenSelector**

Update TokenSelector to display the icon next to token names using `<Image>` from next/image.

**Step 3: Commit**

```bash
git add app/public/tokens/ app/components/token-selector.tsx
git commit -m "feat: add token icons and display in token selector"
```

---

### Task 23: Final polish and verify end-to-end

**Files:**
- Various minor tweaks

**Step 1: Verify the complete flow**

1. Start fresh: `localStorage.clear()` in browser console
2. Refresh page
3. Onboarding overlay appears → wallet generated → tokens funded → overlay dismisses
4. Trade screen: select tokens, enter amount, see rate, click Swap → mock flow runs
5. Explore screen: see token table → click row → navigate to trade with pair selected
6. Wallet badge: shows address → click → copy/reset options
7. Reset wallet: triggers onboarding again

**Step 2: Fix any visual issues**

- Ensure glass-morphism cards look correct against the dark background
- Verify text contrast meets readability standards
- Check that the accent purple is visible on the dark navy background
- Ensure the swap button color states are distinct (idle vs. disabled vs. active)

**Step 3: Update the root README**

Add a brief README.md with:
- What this is
- How to run (`pnpm install && pnpm dev`)
- Screenshot placeholder
- Link to design doc

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final polish and verify end-to-end flow"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|-----------------|
| 1. Scaffold | 1-4 | Working monorepo with contracts, SDK, and frontend packages |
| 2. Contracts | 5-7 | ShieldedFungibleToken + SimpleDEX compiled and tested |
| 3. SDK | 8-10 | Wallet generation, contract helpers, auto-funding |
| 4. Frontend Foundation | 11-13 | Themed app shell with header, nav, routing |
| 5. Trade Screen | 14-15 | Working swap card with token selection and mock execution |
| 6. Explore Screen | 16 | Token listings table with navigation to trade |
| 7. Wallet & Onboarding | 17-19 | Auto wallet generation, funding overlay, wallet badge |
| 8. Integration | 20-23 | Wired-up balances, pair pre-selection, icons, polish |

**Key implementation notes:**
- The SDK uses mock/simulated contract interactions initially. Replace with real Midnight SDK calls as the contract deployment and tooling becomes available.
- Use the `@midnight-*` and `@compact-*` skills referenced in each task for domain-specific guidance.
- The `pragma language_version >= 0.20.0` in contracts matches LunarSwap — this is newer than the syntax reference (0.16-0.18) but is what the compiler version 0.28.0 expects.
