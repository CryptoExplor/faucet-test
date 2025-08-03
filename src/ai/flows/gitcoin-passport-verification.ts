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

export async function getGitcoinPassportScore(input: GitcoinPassportScoreInput): Promise<GitcoinPassportScoreOutput> {
  return gitcoinPassportScoreFlow(input);
}

const getGitcoinPassportScoreTool = ai.defineTool({
    name: 'getGitcoinPassportScore',
    description: 'Retrieves the Gitcoin Passport score for a given Ethereum address from the Gitcoin API.',
    inputSchema: z.object({
        address: z.string().describe('The Ethereum address to check.')
    }),
    outputSchema: z.object({
        score: z.number().describe('The Gitcoin Passport score.')
    }),
    async (input) => {
        const response = await fetch(`https://scorer.gitcoin.co/passport/score/${input.address}`);
        if (!response.ok) {
            console.error('Gitcoin API error:', response.status, response.statusText);
            throw new Error(`Failed to fetch Gitcoin Passport score: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        console.log("Gitcoin Passport Score Data:", data);
        return { score: data.score };
    }
});

const gitcoinPassportScorePrompt = ai.definePrompt({
  name: 'gitcoinPassportScorePrompt',
  tools: [getGitcoinPassportScoreTool],
  input: {schema: GitcoinPassportScoreInputSchema},
  output: {schema: GitcoinPassportScoreOutputSchema},
  prompt: `You are an assistant that helps determine if a user is eligible for claiming tokens based on their Gitcoin Passport score.\n  The eligibility threshold is 10. Use the getGitcoinPassportScore tool to retrieve the user's score, and then determine if they are eligible. Return the score and eligibility status in the output schema format.\n\n  Address: {{{address}}}`,
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
