export { loadOrCreateWallet, resetWallet, hasExistingWallet } from "./wallet.js";
export type { DexWallet } from "./wallet.js";

export { DEFAULT_CONFIG } from "./config.js";
export type { TokenConfig, DexConfig } from "./config.js";

export {
  getExchangeRate,
  calculateSwapOutput,
  executeSwap,
} from "./contracts.js";
export type { SwapStatus, SwapResult } from "./contracts.js";

export { getBalances, fundWallet } from "./funding.js";
export type { FundingStep, FundingStatus, TokenBalance } from "./funding.js";

export { isLaceInstalled, connectLace, disconnectLace } from "./lace.js";
export type { WalletState, LaceConnection } from "./lace.js";
