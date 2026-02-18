/**
 * Lace wallet DApp connector for Midnight.
 *
 * The Lace wallet extension injects entries under `window.midnight` which
 * conform to the {@link InitialAPI} shape from `@midnight-ntwrk/dapp-connector-api`.
 * The well-known key for the Lace wallet is `mnLace`.
 *
 * This module wraps that API with typed helpers for connecting, disconnecting,
 * and retrieving wallet addresses / network configuration.
 */

import type {
  InitialAPI,
  ConnectedAPI,
  Configuration,
} from "@midnight-ntwrk/dapp-connector-api";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** The well-known key under which Lace registers in window.midnight */
const LACE_KEY = "mnLace";

/** The network identifier to pass when connecting (Midnight preprod) */
const DEFAULT_NETWORK_ID = "preprod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Represents the lifecycle states of a Lace wallet connection. */
export type WalletState =
  | { status: "not-installed" }
  | { status: "disconnected" }
  | { status: "connecting" }
  | { status: "connected"; address: string; connectedApi: ConnectedAPI }
  | { status: "error"; error: string };

/** Result returned by a successful {@link connectLace} call. */
export interface LaceConnection {
  /** The wallet's shielded address (Bech32m). */
  address: string;
  /** The full connected API for interacting with the wallet. */
  connectedApi: ConnectedAPI;
  /** Network service URIs reported by the wallet. */
  configuration: Configuration;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the Lace extension is installed.
 *
 * This tests for the presence of `window.midnight.mnLace`.
 */
export function isLaceInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    window.midnight !== undefined &&
    window.midnight[LACE_KEY] !== undefined
  );
}

/**
 * Connect to the Lace wallet extension.
 *
 * If the DApp has not been authorized yet, this triggers the Lace popup
 * asking the user to approve the connection.
 *
 * @param networkId - The network to connect to (defaults to `"preprod"`).
 * @returns The wallet address, connected API, and network configuration.
 * @throws If Lace is not installed or the user rejects the connection.
 */
export async function connectLace(
  networkId: string = DEFAULT_NETWORK_ID,
): Promise<LaceConnection> {
  if (!isLaceInstalled()) {
    throw new Error(
      "Lace wallet extension is not installed. " +
        "Please install the Lace browser extension and reload the page.",
    );
  }

  const initialApi: InitialAPI = window.midnight![LACE_KEY]!;

  // Initiate the connection -- may trigger the authorization popup.
  const connectedApi: ConnectedAPI = await initialApi.connect(networkId);

  // Retrieve the wallet's shielded address to use as the display address.
  const { shieldedAddress } = await connectedApi.getShieldedAddresses();

  // Retrieve the network configuration (indexer, node, prover URIs).
  const configuration = await connectedApi.getConfiguration();

  return {
    address: shieldedAddress,
    connectedApi,
    configuration,
  };
}

/**
 * Disconnect from Lace.
 *
 * The DApp Connector API does not expose an explicit disconnect method.
 * This function exists so that callers have a single place to perform
 * any local cleanup required when the user wants to "disconnect".
 *
 * Callers should clear their own wallet state after invoking this.
 */
export function disconnectLace(): void {
  // Lace / the DApp Connector API has no explicit disconnect endpoint.
  // Calling code should discard its ConnectedAPI reference and reset state.
}
