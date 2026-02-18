/**
 * DEX configuration and token registry.
 *
 * Token addresses below are placeholders that will be replaced with real
 * contract addresses after deployment to preprod. The rest of the config
 * (network URLs, decimals, etc.) mirrors what a production DEX would need.
 */

// ---------------------------------------------------------------------------
// Network configuration
// ---------------------------------------------------------------------------

/**
 * Connection details for a Midnight network node.
 *
 * When a Lace wallet is connected, its `Configuration` object provides
 * `indexerUri`, `substrateNodeUri`, and `proofServerUri` — those values
 * can be used to populate a `NetworkConfig` at runtime instead of relying
 * on the baked-in defaults below.
 */
export interface NetworkConfig {
  indexerUrl: string;
  nodeUrl: string;
  proofServerUrl: string;
}

/** Midnight preprod endpoints. */
export const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  indexerUrl: "https://indexer.preprod.midnight.network/api/v1/graphql",
  nodeUrl: "wss://rpc.preprod.midnight.network",
  proofServerUrl: "https://proof.preprod.midnight.network",
};

// ---------------------------------------------------------------------------
// Token & DEX configuration
// ---------------------------------------------------------------------------

export interface TokenConfig {
  name: string;
  symbol: string;
  /** Contract address for this token on the Midnight network */
  address: string;
  decimals: number;
  /** Emoji or path used as the token icon in the UI */
  icon: string;
}

export interface DexConfig {
  networkId: string;
  rpcUrl: string;
  indexerUrl: string;
  dexContractAddress: string;
  tokens: TokenConfig[];
}

/**
 * Default configuration for the DEX proof-of-concept.
 *
 * All contract addresses are placeholders — they will be populated
 * after the contracts are deployed to the Midnight preprod network.
 */
export const DEFAULT_CONFIG: DexConfig = {
  networkId: "preprod",
  rpcUrl: DEFAULT_NETWORK_CONFIG.nodeUrl,
  indexerUrl: DEFAULT_NETWORK_CONFIG.indexerUrl,
  dexContractAddress: "0x_DEX_CONTRACT_PLACEHOLDER",
  tokens: [
    {
      name: "Midnight",
      symbol: "tMIDN",
      // Populated after deployment
      address: "0x_TMIDN_PLACEHOLDER",
      decimals: 18,
      icon: "tMIDN",
    },
    {
      name: "USD Coin",
      symbol: "tUSDC",
      // Populated after deployment
      address: "0x_TUSDC_PLACEHOLDER",
      decimals: 18,
      icon: "tUSDC",
    },
    {
      name: "Bitcoin",
      symbol: "tBTC",
      // Populated after deployment
      address: "0x_TBTC_PLACEHOLDER",
      decimals: 18,
      icon: "tBTC",
    },
  ],
};
