import { sdk, type FarcasterUser, type FarcasterContext } from "@farcaster/miniapp-sdk";

// Re-export the necessary types from the official SDK
export { type FarcasterUser, type FarcasterContext };

// Create a unified farcasterSDK object that wraps the official functions
export const farcasterSDK = {
  init: sdk.init,
  getContext: sdk.getContext,
  getEthereumProvider: sdk.getEthereumProvider,
  openUrl: sdk.openUrl,
  composeCast: sdk.composeCast,
  sendNotification: sdk.sendNotification,
  ready: sdk.ready
};
