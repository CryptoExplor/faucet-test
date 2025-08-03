# Farcaster Superchain Faucet

This is a multi-chain faucet designed to run as a Farcaster Mini App. It allows users to claim testnet ETH on various Superchain networks after verifying their humanity with a Gitcoin Passport score.

## Current Status
- ✅ **Mini App**: Core application logic is implemented for both a standard web UI and a Farcaster Mini App.
- ✅ **Farcaster Frame**: A basic frame is configured to launch the Mini App.
- ✅ **Rate Limiting**: Uses Upstash Redis for server-side rate-limiting.
- ✅ **Network Config**: Network configurations are managed statically, making it easy to add or disable faucets.

---

## How to Test This Application

Testing a Farcaster Mini App involves checking its functionality both as a standalone web app and within a Farcaster client.

### 1. Local Development (Standard Browser)

This method is for testing the core UI and claim functionality without Farcaster-specific features.

**A. Run the Development Server:**
```bash
npm install
npm run dev
```
The application will be available at `http://localhost:9002`.

**B. Test the Web UI:**
- **Connect Wallet**: Use a browser wallet like MetaMask to connect to the app.
- **Check Eligibility**: The app will automatically attempt to fetch a Gitcoin Passport score for the connected wallet.
- **Select Network & Claim**: Choose a network from the dropdown and click the claim button to test the faucet logic. You will need to fund the faucet's wallet address in your `.env` file for claims to succeed.

### 2. Farcaster Environment Testing

This method is for testing the complete Mini App experience within a Farcaster client like Warpcast.

**A. Expose Your Local Server:**
Your local server needs a public URL so that Farcaster clients can access it. `ngrok` is a great tool for this.

1.  Install `ngrok` (see [ngrok.com](https://ngrok.com/)).
2.  Run the following command to create a public tunnel to your local app:
    ```bash
    ngrok http 9002
    ```
3.  `ngrok` will provide you with a public URL (e.g., `https://random-string.ngrok-free.app`). **Copy this URL.**

**B. Use Farcaster Developer Tools:**
1.  In your Farcaster client (e.g., Warpcast), go to **Settings > Advanced > Developer Tools** and enable them.
2.  In the Developer Tools menu, you can now open a Mini App by pasting your public `ngrok` URL.
3.  This will launch your application inside the client's webview, allowing you to test the Farcaster SDK integration (e.g., fetching user profile, connecting the Farcaster wallet).

**C. Test the Frame in a Cast:**
- Create a new cast and paste your public `ngrok` URL into it.
- The Farcaster client should render a Frame with a button. Clicking this button will launch your Mini App.

### 3. Manifest and Environment Variables

- **Manifest**: Your manifest file is served from `src/app/.well-known/farcaster.json/route.ts`. To make it official, you need to generate `accountAssociation` tokens and add them.
- **Environment**: Before testing claims, ensure you have a `.env.local` file with the required variables:
  - `FAUCET_MNEMONIC`: The mnemonic for the wallet that will fund the claims.
  - `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: For rate-limiting.
  - `GITCOIN_API_KEY` / `GITCOIN_SCORER_ID`: For checking passport scores.
  - RPC URLs for the networks you want to support (e.g., `BASE_SEPOLIA_RPC_URL`).

---

## Publishing Your Mini App

1.  **Deploy**: Deploy your application to a public hosting provider like Vercel or Firebase App Hosting to get a permanent URL.
2.  **Generate Account Association**: Use Farcaster developer tools to generate an association token for your deployed domain.
3.  **Update Manifest**: Add the `accountAssociation` token and signature to your manifest logic in `src/app/.well-known/farcaster.json/route.ts`.
4.  **Test Live**: Test your deployed URL in a Farcaster client to ensure everything works as expected.
