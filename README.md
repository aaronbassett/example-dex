# Midnight DEX — Example

A proof-of-concept decentralized exchange built on [Midnight](https://midnight.network), demonstrating privacy-preserving token swaps using zero-knowledge proofs.

> **Status:** This is a PoC with mock implementations. Contract interactions, wallet operations, and token balances are simulated. See the TODO markers throughout the SDK package for where real Midnight SDK calls should be integrated.

## Features

- **Token Swaps** — Trade between tMIDN, tUSDC, and tBTC with a familiar swap interface
- **Auto-generated Wallet** — In-browser wallet creation with automatic testnet token funding
- **Market Explorer** — Browse available trading pairs and navigate directly to trade
- **ZK Transaction Lifecycle** — UI feedback for every stage: build → prove → submit → confirm

## Quick Start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — the app will automatically generate a wallet and fund it with testnet tokens on first visit.

## Project Structure

```
├── contracts/           # Compact smart contracts
│   └── src/
│       ├── token/       # ShieldedFungibleToken (from OpenZeppelin)
│       └── dex/         # SimpleDEX rate oracle
├── packages/sdk/        # TypeScript SDK (wallet, contracts, funding)
│   └── src/
│       ├── wallet.ts    # In-browser wallet generation
│       ├── contracts.ts # Swap execution (mock)
│       ├── funding.ts   # Auto-funding flow (mock)
│       └── config.ts    # Token registry and network config
└── app/                 # Next.js frontend
    ├── app/             # Routes (trade, explore)
    ├── components/      # UI components
    └── lib/             # Wallet context and utilities
```

## Architecture

The DEX uses a simplified swap model where the **SimpleDEX** contract acts as a rate oracle. In a production implementation, the client-side swap flow would:

1. Read the exchange rate from the SimpleDEX ledger
2. Burn the input tokens via the ShieldedFungibleToken contract
3. Mint the output tokens at the oracle-provided rate
4. All steps generate ZK proofs for privacy

See [docs/plans/2026-02-18-dex-poc-design.md](docs/plans/2026-02-18-dex-poc-design.md) for the full design document.

## Tech Stack

- **Contracts:** [Compact](https://docs.midnight.network/compact) (Midnight's smart contract language)
- **Frontend:** Next.js 15, React 19, Tailwind CSS v4
- **SDK:** TypeScript with mock implementations
- **Tooling:** pnpm workspaces, Turborepo
