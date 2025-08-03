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

const getGitcoinPassportScoreTool = ai.defineTool({
    name: 'getGitcoinPassportScoreTool',
    description: 'Retrieves the Gitcoin Passport score for a given Ethereum address from the Gitcoin API.',
    inputSchema: z.object({
        address: z.string().describe('The Ethereum address to check.')
    }),
    outputSchema: z.object({
        score: z.number().describe('The Gitcoin Passport score.')
    }),
}, async (input) => {
    const { address } = input;
    const apiKey = process.env.GITCOIN_API_KEY;
    const scorerId = process.env.GITCOIN_SCORER_ID;
    
    if (!apiKey || !scorerId) {
        console.error("Gitcoin API credentials not configured. Set GITCOIN_API_KEY and GITCOIN_SCORER_ID.");
        // Return a score of 0 if the service is not configured.
        return { score: 0 };
    }
    
    try {
        const response = await fetch(`https://api.scorer.gitcoin.co/registry/score/${scorerId}/${address}`, {
             headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            const data = await response.json();
            // Ensure score is a number, default to 0 if parsing fails
            return { score: parseFloat(data.score || "0") };
        } else {
             const errorBody = await response.text();
            console.error(`Gitcoin API Error for ${address}: ${errorBody}`);
        }

    } catch (error) {
        console.error(`Error fetching Gitcoin score for ${address}:`, error);
    }
    
    // Default to a score of 0 in case of any errors
    return { score: 0 };
});

const gitcoinPassportScorePrompt = ai.definePrompt({
  name: 'gitcoinPassportScorePrompt',
  tools: [getGitcoinPassportScoreTool],
  input: {schema: GitcoinPassportScoreInputSchema},
  output: {schema: GitcoinPassportScoreOutputSchema},
  prompt: `You are an assistant that helps determine if a user is eligible for claiming tokens based on their Gitcoin Passport score. The eligibility threshold is 10. Use the getGitcoinPassportScoreTool to retrieve the score for the user's address and determine their eligibility.

Address: {{{address}}}`,
});

const gitcoinPassportScoreFlow = ai.defineFlow(
  {
    name: 'gitcoinPassportScoreFlow',
    inputSchema: GitcoinPassportScoreInputSchema,
    outputSchema: GitcoinPassportScoreOutputSchema,
  },
  async input => {
    const {output} = await gitcoinPassportScorePrompt(input);
    return output!;
  }
);

export async function getGitcoinPassportScore(input: GitcoinPassportScoreInput): Promise<GitcoinPassportScoreOutput> {
  return gitcoinPassportScoreFlow(input);
}
