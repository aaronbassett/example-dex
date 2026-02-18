# Midnight DEX PoC Design

## Overview

A proof-of-concept decentralized exchange for the Midnight Foundation, based on LunarSwap (OpenZeppelin/midnight-apps). Two screens (Trade, Explore), automatic in-browser wallet generation, and test token funding. No liquidity pools.

## Architecture

Monorepo with three workspace packages:

```
example-dex/
├── contracts/                    # Compact smart contracts
│   ├── src/
│   │   ├── token/               # ShieldedFungibleToken (from LunarSwap)
│   │   └── dex/                 # SimpleDEX swap contract (new)
│   ├── package.json
│   └── vitest.config.ts
├── app/                          # Next.js 15 frontend
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Redirects to /trade
│   │   ├── trade/page.tsx
│   │   └── explore/page.tsx
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── package.json
├── packages/
│   └── sdk/                     # Shared Midnight integration
│       ├── src/
│       │   ├── wallet.ts        # In-browser wallet generation
│       │   ├── funding.ts       # Auto-fund with test tokens
│       │   └── contracts.ts     # Contract interaction helpers
│       └── package.json
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

**Tooling**: pnpm 10 + turbo, Node 22, TypeScript 5.

## Smart Contracts

### ShieldedFungibleToken (from LunarSwap)

Reuse OpenZeppelin's ShieldedERC20.compact with the ShieldedFungibleToken wrapper. Three instances deployed:

- **tMIDN** — Midnight test token (base currency)
- **tUSDC** — Mock stablecoin
- **tBTC** — Mock wrapped Bitcoin

Open `mint` circuit (no access control) allows the frontend to mint test tokens directly.

Note: ShieldedERC20 has a "DO NOT USE IN PRODUCTION" warning due to Midnight limitations around custom spend logic. Acceptable for a PoC.

### SimpleDEX (new)

Minimal swap contract with fixed exchange rates:

- Holds reserves of token pairs, pre-funded at deployment
- `swap` circuit: receives input token, looks up rate, mints output token to user
- Rates stored in ledger state (admin-settable)
- No slippage, fees, or price discovery

Compiled with `compactc 0.28.0`. Use `--skip-zk` for fast dev builds, full ZK for testnet.

## Wallet Generation & Auto-Funding

### Wallet

On first visit:

1. Generate keypair using `@midnight-ntwrk/wallet-api`
2. Store in localStorage under `midnight-dex-wallet`
3. Display address in header — no connect button, no extension

On subsequent visits, load existing wallet from localStorage.

### Auto-Funding

After wallet generation, check balances and fund if empty:

1. Check tDUSK balance — if zero, hit Midnight testnet faucet API
2. Check token balances — if zero, call `mint()` on each token contract:
   - 1,000 tMIDN
   - 5,000 tUSDC
   - 0.5 tBTC

### Onboarding UX

Brief overlay showing progress: "Generating wallet..." → "Funding gas tokens..." → "Minting test tokens..." → "Ready to trade!" (~10-30s on testnet)

"Reset Wallet" option in account menu wipes localStorage and restarts.

## Frontend

### Visual Design

Custom Midnight brand theme:

- **Background**: Deep navy/charcoal (#0a0e1a → #141928)
- **Accent**: Purple/violet (#7c3aed → #a78bfa) for CTAs
- **Secondary**: Cool teal (#06b6d4) for positive values
- **Typography**: Inter
- **Cards**: Glass-morphism with backdrop-blur and thin borders

### Trade Screen (`/trade`)

Swap card with:
- Token input fields (amount + token selector dropdown)
- Swap direction toggle
- Rate display from SimpleDEX contract state
- Contextual swap button showing transaction stage

Transaction stages: idle → building → proving → submitting → confirming → success/error

### Explore Screen (`/explore`)

Token listings table with mock market data:
- Token pair, price, 24h change, volume (hardcoded/randomly fluctuated client-side)
- Clickable rows navigate to `/trade?from=X&to=Y`
- Optional sparkline charts (mock data)

### Components

From shadcn/ui: Button, Card, Dialog, Select, Tabs, Tooltip.

Custom: SwapCard, TokenSelector, WalletBadge, OnboardingOverlay, TokenTable.

## State Management

React Context only:
- **WalletContext** — keys, address, connection state, balances
- **ContractContext** — deployed addresses, ABIs, provider

Balances refresh on: initial load, after swap, 30-second polling.

## Error Handling

Three categories:

1. **Wallet errors** — error in onboarding overlay with retry
2. **Transaction errors** — inline error below swap button, form stays filled
3. **Network errors** — toast with auto-retry (exponential backoff, 3 attempts)

No global error boundaries. Each screen handles errors locally.

## Contract Deployment

Deployment script (`contracts/scripts/deploy.ts`):

1. Deploy three ShieldedFungibleToken instances
2. Deploy SimpleDEX contract
3. Mint initial reserves into DEX
4. Set exchange rates
5. Output addresses to JSON config for frontend

Addresses hardcoded in `lib/contracts-config.ts` after initial deployment.

## Testing

- **Contract tests** (vitest): SimpleDEX swap logic via compact-tools-simulator
- **Frontend**: Manual testing against testnet (no unit tests for PoC)

## Deployment

Frontend: static export (`next build`) to Netlify/Vercel/any static host.

## Out of Scope

- Liquidity pools / AMM
- Price discovery / dynamic pricing
- Transaction history
- Multi-wallet support
- Mobile responsive design
- Analytics / monitoring
- Production security hardening
