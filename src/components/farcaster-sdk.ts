import { init, getContext, getEthereumProvider, openUrl, composeCast, sendNotification, type FarcasterContext, type FarcasterUser } from "@farcaster/miniapp-sdk";

// Re-export the necessary types and functions from the official SDK
export { type FarcasterContext, type FarcasterUser };

// Create a unified farcasterSDK object that wraps the official functions
export const farcasterSDK = {
  init,
  getContext,
  getEthereumProvider,
  openUrl,
  composeCast,
  sendNotification
};
