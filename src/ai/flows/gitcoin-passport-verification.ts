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
    // This tool now implements the more robust fetching logic
    // but the prompt and flow above it do not need to change.
    const { address } = input;
    const apiKey = process.env.GITCOIN_API_KEY;
    const scorerId = process.env.GITCOIN_SCORER_ID;
    
    if (!apiKey || !scorerId) {
        console.error("Gitcoin API credentials not configured");
        // Return 0 score if not configured on the server
        return { score: 0 };
    }

    // Try v2 API first
    try {
        const v2Response = await fetch(`https://api.passport.xyz/v2/stamps/${scorerId}/score/${address}`, {
            headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        });
        if (v2Response.ok) {
            const data = await v2Response.json();
            console.log("Gitcoin v2 score:", data.score)
            return { score: parseFloat(data.score || "0") };
        }
         console.warn(`Gitcoin v2 API failed with status: ${v2Response.status}`);
    } catch (error) {
        console.error("Error fetching from Gitcoin v2 API:", error);
    }

    // Fallback to v1 API
    try {
        const v1Response = await fetch(`https://api.scorer.gitcoin.co/registry/score/${scorerId}/${address}`, {
             headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        });
        if (v1Response.ok) {
            const data = await v1Response.json();
            console.log("Gitcoin v1 score:", data.score)
            return { score: parseFloat(data.score || "0") };
        }
        console.warn(`Gitcoin v1 API failed with status: ${v1Response.status}`);
    } catch (error) {
        console.error("Error fetching from Gitcoin v1 API:", error);
    }
    
    // Fallback to original public endpoint
    try {
      const response = await fetch(`https://scorer.gitcoin.co/passport/score/${address}`);
      if(response.ok) {
        const data = await response.json();
        console.log("Gitcoin public score:", data.score)
        return { score: data.score || 0 };
      }
    } catch(e) {
      console.error("Error fetching from Gitcoin public API:", e);
    }


    console.log(`Could not retrieve passport score for ${address}. Defaulting to 0.`);
    return { score: 0 };
});

const gitcoinPassportScorePrompt = ai.definePrompt({
  name: 'gitcoinPassportScorePrompt',
  tools: [getGitcoinPassportScoreTool],
  input: {schema: GitcoinPassportScoreInputSchema},
  output: {schema: GitcoinPassportScoreOutputSchema},
  prompt: `You are an assistant that helps determine if a user is eligible for claiming tokens based on their Gitcoin Passport score.\n  The eligibility threshold is 10. Use the getGitcoinPassportScoreTool to retrieve the user's score, and then determine if they are eligible. Return the score and eligibility status in the output schema format.\n\n  Address: {{{address}}}`,
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