/**
 * On-chain contract reader for the SimpleDEX.
 *
 * Provides read-only access to the deployed SimpleDEX contract's ledger
 * state via the Midnight indexer. This module is the bridge between the
 * frontend's rate-lookup logic and the actual on-chain data.
 *
 * The implementation is currently stubbed — once the full Midnight SDK
 * pipeline is available in the browser, the TODO comments below show
 * exactly which calls to wire up.
 */

/**
 * Read the exchange rate for a token pair from the deployed SimpleDEX contract.
 *
 * Connects to the indexer, finds the deployed contract, and reads the rate
 * from its ledger state.
 *
 * @param tokenA - Symbol of the first token (e.g. "tMIDN")
 * @param tokenB - Symbol of the second token (e.g. "tUSDC")
 * @param config - Indexer URL and deployed contract address
 * @returns The on-chain rate as a scaled bigint, or `null` if not found.
 */
export async function readOnChainRate(
  tokenA: string,
  tokenB: string,
  config: { indexerUrl: string; dexContractAddress: string },
): Promise<bigint | null> {
  // TODO: Implement real on-chain rate reading:
  //
  // 1. Connect to the indexer's public data provider
  //    const publicDataProvider = indexerPublicDataProvider(config.indexerUrl);
  //
  // 2. Use findDeployedContract() with the SimpleDEX contract
  //    const contractState = await findDeployedContract(publicDataProvider, {
  //      contractAddress: config.dexContractAddress,
  //      contract: SimpleDEX.Contract,
  //    });
  //
  // 3. Read ledger state
  //    const ledgerState = SimpleDEX.ledger(contractState.data);
  //
  // 4. Compute pair_key for tokenA/tokenB
  //    (use persistentHash from @midnight-ntwrk/compact-runtime)
  //
  // 5. Look up the rate from the rates Map
  //
  // 6. Return the rate as bigint, or null if not found

  console.warn(`readOnChainRate: not yet implemented (${tokenA}/${tokenB})`);
  return null;
}
