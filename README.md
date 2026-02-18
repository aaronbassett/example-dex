# Midnight DEX — Example

A proof-of-concept decentralized exchange built on [Midnight](https://midnight.network), demonstrating privacy-preserving token swaps using zero-knowledge proofs.

> **Status:** This is a PoC with real contract compilation, testnet deployment scripts, and Lace wallet integration. Swap execution is still mocked on the client side — the contracts compile and deploy, exchange rates can be read from on-chain state, but the full burn/mint swap flow is not yet wired end-to-end. See the TODO markers throughout the SDK package for where the remaining pieces should be integrated.

## Features

- **Compilable Compact Smart Contracts** — SimpleDEX rate oracle and ShieldedFungibleToken contracts, compilable via `compactc`
- **Lace Wallet Integration** — Connect and disconnect via the Lace browser extension (replaces auto-generated wallet)
- **Deploy CLI** — Command-line scripts for deploying contracts to the Midnight testnet
- **On-chain Rate Reads** — Exchange rates are read from the deployed SimpleDEX ledger, with automatic fallback to mock values when a contract is not deployed
- **Token Swaps** — Trade between tMIDN, tUSDC, and tBTC with a familiar swap interface (swap execution is mocked)
- **Market Explorer** — Browse available trading pairs and navigate directly to trade
- **ZK Transaction Lifecycle** — UI feedback for every stage: build, prove, submit, confirm

## Prerequisites

- **Node.js** >= 22
- **pnpm** 10.x
- **Compact compiler** (`compactc` v0.28.0) — installed via the `compact` toolchain manager
- **Lace wallet browser extension** — for connecting a wallet in the frontend
- **Docker** (optional) — required for the proof server during contract deployment

## Quick Start

```bash
pnpm install
pnpm build        # Compiles contracts + SDK + app
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). You will need the Lace wallet browser extension installed to connect a wallet and interact with the DEX.

## Contract Compilation

The Compact smart contracts can be compiled independently of the rest of the build:

```bash
# Fast compilation (skip ZK circuits, for development)
pnpm compact:fast

# Full compilation (with ZK circuits, for deployment)
pnpm compact
```

Compiled artifacts are written to `contracts/src/artifacts/` and re-exported through TypeScript wrappers in `contracts/src/dex/` and `contracts/src/token/`.

## Deployment

Deploy contracts to the Midnight testnet using the deploy CLI:

```bash
# Deploy SimpleDEX to testnet
MIDNIGHT_SEED="your seed phrase" pnpm deploy:dex

# Set initial exchange rates
MIDNIGHT_SEED="your seed phrase" pnpm deploy:set-rates
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment instructions, proof server setup, and troubleshooting.

## Environment Variables

| Variable | Description |
| --- | --- |
| `MIDNIGHT_SEED` | Seed phrase for the deployer wallet |
| `MIDNIGHT_RPC_URL` | Override for the Midnight RPC endpoint |
| `MIDNIGHT_INDEXER_URL` | Override for the indexer endpoint |
| `MIDNIGHT_PROOF_SERVER_URL` | Override for the proof server |

## Project Structure

```
├── contracts/           # Compact smart contracts
│   └── src/
│       ├── dex/         # SimpleDEX rate oracle + TS wrapper
│       ├── token/       # ShieldedFungibleToken + TS wrapper
│       ├── artifacts/   # Compiled contract outputs
│       └── index.ts     # Barrel export
├── packages/
│   ├── sdk/             # TypeScript SDK
│   │   └── src/
│   │       ├── lace.ts            # Lace wallet connector
│   │       ├── contract-reader.ts # On-chain rate reads
│   │       ├── contracts.ts       # Swap execution (real + mock fallback)
│   │       ├── config.ts          # Network + token config
│   │       ├── wallet.ts          # Legacy mock wallet (kept for reference)
│   │       └── funding.ts         # Legacy mock funding (kept for reference)
│   └── deploy-cli/      # Deployment CLI
│       └── src/
│           ├── deploy-dex.ts  # Deploy SimpleDEX to testnet
│           ├── set-rates.ts   # Set exchange rates on deployed contract
│           ├── providers.ts   # Network provider setup
│           └── config.ts      # Testnet configuration
└── app/                 # Next.js frontend
    ├── app/             # Routes (trade, explore)
    ├── components/      # UI (wallet-badge, swap-card, etc.)
    └── lib/             # Wallet context (Lace integration)
```

## Architecture

The DEX uses a simplified swap model where the **SimpleDEX** contract acts as a rate oracle. The frontend reads exchange rates from the deployed contract's ledger state when available, falling back to mock values when no contract is deployed. In a production implementation, the client-side swap flow would:

1. Read the exchange rate from the SimpleDEX ledger
2. Burn the input tokens via the ShieldedFungibleToken contract
3. Mint the output tokens at the oracle-provided rate
4. All steps generate ZK proofs for privacy

See [docs/plans/2026-02-18-dex-poc-design.md](docs/plans/2026-02-18-dex-poc-design.md) for the full design document.

## Tech Stack

- **Contracts:** [Compact](https://docs.midnight.network/compact) (Midnight's smart contract language), compiled with `compactc` v0.28.0
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **Wallet:** Lace browser extension via `@midnight-ntwrk/midnight-js-wallet-api`
- **SDK:** TypeScript with on-chain reads and mock fallbacks
- **Deployment:** Custom CLI scripts using `@midnight-ntwrk/midnight-js-contracts`
- **Tooling:** pnpm workspaces, Turborepo
