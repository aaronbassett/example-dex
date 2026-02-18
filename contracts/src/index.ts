/**
 * @midnight-dex/contracts — barrel file
 *
 * Re-exports compiled contract artifacts as namespaces so consumers can import:
 *   import * as dex from '@midnight-dex/contracts/dex';
 *   import * as token from '@midnight-dex/contracts/token';
 *   // or
 *   import { dex, token } from '@midnight-dex/contracts';
 */
export * as dex from './dex/index.js';
export * as token from './token/index.js';
