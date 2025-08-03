'use server';
/**
 * @fileOverview Fetches and verifies a user's Gitcoin Passport score.
 *
 * - getGitcoinPassportScore - A function that fetches the Gitcoin Passport score for a given address.
 * - GitcoinPassportScoreInput - The input type for the getGitcoinPassportScore function.
 * - GitcoinPassportScoreOutput - The return type for the getGitcoinPassportScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GitcoinPassportScoreInputSchema = z.object({
  address: z.string().describe('The Ethereum address to check.'),
});
export type GitcoinPassportScoreInput = z.infer<typeof GitcoinPassportScoreInputSchema>;

const GitcoinPassportScoreOutputSchema = z.object({
  score: z.number().describe('The Gitcoin Passport score for the address.'),
  isEligible: z.boolean().describe('Whether the user is eligible based on the score.'),
});
export type GitcoinPassportScoreOutput = z.infer<typeof GitcoinPassportScoreOutputSchema>;

const ELIGIBILITY_THRESHOLD = 10;

const gitcoinPassportScoreFlow = ai.defineFlow(
  {
    name: 'gitcoinPassportScoreFlow',
    inputSchema: GitcoinPassportScoreInputSchema,
    outputSchema: GitcoinPassportScoreOutputSchema,
  },
  async ({ address }) => {
    const apiKey = process.env.GITCOIN_API_KEY;
    const scorerId = process.env.GITCOIN_SCORER_ID;

    if (!apiKey || !scorerId) {
      console.error("Gitcoin API credentials not configured. Set GITCOIN_API_KEY and GITCOIN_SCORER_ID.");
      return { score: 0, isEligible: false };
    }

    try {
      const response = await fetch(`https://api.scorer.gitcoin.co/registry/score/${scorerId}/${address}`, {
           headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
      });

      if (response.ok) {
          const data = await response.json();
          const score = parseFloat(data.score || "0");
          return { score, isEligible: score >= ELIGIBILITY_THRESHOLD };
      } else {
           const errorBody = await response.text();
          console.error(`Gitcoin API Error for ${address}: ${errorBody}`);
      }

    } catch (error) {
        console.error(`Error fetching Gitcoin score for ${address}:`, error);
    }
    
    // Default to a score of 0 in case of any errors
    return { score: 0, isEligible: false };
  }
);

export async function getGitcoinPassportScore(input: GitcoinPassportScoreInput): Promise<GitcoinPassportScoreOutput> {
  return gitcoinPassportScoreFlow(input);
}
