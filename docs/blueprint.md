# **App Name**: SepoliaDrop

## Core Features:

- Wallet Connection: Connect to MetaMask to get the user's address and enable transaction signing.
- Chain Selection: Allow users to select one of the 10 supported Sepolia test networks from a dropdown list.
- Gitcoin Passport Verification: Tool: Fetch Gitcoin Passport score from the Gitcoin Scorer API using the user's wallet address, and use that score to determine whether the user is eligible for claiming tokens.
- Information Display: Display the wallet address, Gitcoin Passport score, and claim button in the UI.
- Token Claiming: Handle the token claiming process on the backend using a serverless Node.js function, rate-limiting by address and chain ID.
- Transaction Status: Display success or failure messages with transaction hash after a claim attempt.

## Style Guidelines:

- Primary color: Saturated purple (#9D4EDD) to convey innovation and trust in the multi-chain aspect.
- Background color: Light desaturated purple (#F5EEFC) for a clean, modern look.
- Accent color: Analogous pink (#EE4266) to highlight CTAs and important info, and create a high contrast with the background.
- Body and headline font: 'Inter', a grotesque sans-serif for a modern and neutral look suitable for headlines and body text.
- Use simple, outlined icons for clarity and a modern aesthetic.
- Mobile-first responsive layout with a clean, uncluttered design. Maximize clarity and ease of use.
- Subtle loading animations for buttons and data fetching states to improve user experience.