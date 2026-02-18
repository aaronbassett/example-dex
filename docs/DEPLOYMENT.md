# Deployment Guide

This guide walks through deploying the SimpleDEX contract to the Midnight testnet and running the application against it.

## Prerequisites

- **Node.js** >= 22
- **pnpm** 10.x
- **Compact compiler** v0.28.0, installed via the `compact` toolchain manager
  - Follow the installation instructions at <https://docs.midnight.network>
- **Docker** (required for the proof server)
- **Lace browser extension**
  - Install from: <https://chromewebstore.google.com/detail/lace/gafhhkghbfjjkeiendhlofajokpaflmk>
  - Configure the extension for the Midnight testnet
- **tDUST** (testnet gas tokens) from the Midnight faucet

## 1. Start the Proof Server

The proof server generates ZK proofs locally. It must be running throughout the deployment process.

```bash
docker run -p 6300:6300 midnightntwrk/proof-server:7.0.0
```

## 2. Get tDUST from the Faucet

1. Navigate to the Midnight testnet faucet: <https://faucet.testnet-02.midnight.network>
2. Enter your wallet address.
3. Wait for the tokens to arrive. You can verify receipt via the indexer.

## 3. Compile Contracts

```bash
# Install dependencies
pnpm install

# Fast compilation (skip ZK circuits — good for development)
pnpm compact:fast

# Full compilation (with ZK circuits — required for deployment)
pnpm compact

# Build everything (contracts + SDK + app)
pnpm build
```

Use `pnpm compact:fast` during development for faster iteration. A full `pnpm compact` build is required before deploying to testnet.

## 4. Deploy SimpleDEX

```bash
# Set your seed phrase as an environment variable
export MIDNIGHT_SEED="your twelve word seed phrase here"

# Deploy the SimpleDEX contract
pnpm deploy:dex
```

This will:

1. Connect to the Midnight testnet.
2. Deploy the SimpleDEX contract with your wallet as admin.
3. Write the contract address to `packages/deploy-cli/deployed-addresses.json`.

## 5. Set Initial Exchange Rates

```bash
pnpm deploy:set-rates
```

This sets the following rates (matching the mock values):

| Pair | Rate |
|------|------|
| tMIDN/tUSDC | 1,800 |
| tUSDC/tMIDN | 0.000556 |
| tMIDN/tBTC | 0.02667 |
| tBTC/tMIDN | 37.5 |
| tUSDC/tBTC | 0.0000148 |
| tBTC/tUSDC | 67,568 |

## 6. Run the Application

```bash
pnpm dev
```

Open <http://localhost:3000>, install the Lace wallet extension if you have not already, and click **Connect Wallet** to start trading.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MIDNIGHT_SEED` | *(required)* | Seed phrase for the deployer/admin wallet |
| `MIDNIGHT_RPC_URL` | `https://rpc.testnet-02.midnight.network` | Midnight node RPC endpoint |
| `MIDNIGHT_INDEXER_URL` | `https://indexer.testnet-02.midnight.network` | Indexer GraphQL endpoint |
| `MIDNIGHT_PROOF_SERVER_URL` | `http://localhost:6300` | Local proof server URL |

## Troubleshooting

- **"compact: command not found"** -- Install the Compact toolchain manager. See <https://docs.midnight.network> for instructions.
- **"Lace wallet extension is not installed"** -- Install from the Chrome Web Store and configure it for the Midnight testnet.
- **Proof server not running** -- Ensure Docker is running and the proof server container is up on port 6300.
- **"No rate set for pair"** -- Run `pnpm deploy:set-rates` to seed exchange rates on the deployed contract.
- **Build fails with polyfill errors** -- The app requires Node.js >= 22. Check your version with `node --version`.

## Architecture Notes

The deployment creates a SimpleDEX contract that acts as a rate oracle. The actual swap flow (burn source tokens, mint destination tokens) remains mocked in the SDK. The contract only stores and returns exchange rates.

When the app connects to a Lace wallet, exchange rates are read from the deployed contract via the indexer. If no contract is deployed or the read fails, the app falls back to hardcoded mock rates.
