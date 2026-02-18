/**
 * DEX configuration and token registry.
 *
 * Token addresses below are placeholders that will be replaced with real
 * contract addresses after testnet deployment. The rest of the config
 * (network URLs, decimals, etc.) mirrors what a production DEX would need.
 */

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
 * after the contracts are deployed to the Midnight testnet.
 */
export const DEFAULT_CONFIG: DexConfig = {
  networkId: "testnet",
  rpcUrl: "https://rpc.testnet.midnight.network",
  indexerUrl: "https://indexer.testnet.midnight.network",
  dexContractAddress: "0x_DEX_CONTRACT_PLACEHOLDER",
  tokens: [
    {
      name: "Midnight",
      symbol: "tMIDN",
      // Populated after testnet deployment
      address: "0x_TMIDN_PLACEHOLDER",
      decimals: 18,
      icon: "tMIDN",
    },
    {
      name: "USD Coin",
      symbol: "tUSDC",
      // Populated after testnet deployment
      address: "0x_TUSDC_PLACEHOLDER",
      decimals: 18,
      icon: "tUSDC",
    },
    {
      name: "Bitcoin",
      symbol: "tBTC",
      // Populated after testnet deployment
      address: "0x_TBTC_PLACEHOLDER",
      decimals: 18,
      icon: "tBTC",
    },
  ],
};
