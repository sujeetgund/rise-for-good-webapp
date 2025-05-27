'use server';
/**
 * @fileOverview AI moderation system for campaign and petition content.
 *
 * - moderateCampaignContent - A function that moderates campaign content for appropriateness, clarity, and decency.
 * - ModerateCampaignContentInput - The input type for the moderateCampaignContent function.
 * - ModerateCampaignContentOutput - The return type for the moderateCampaignContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateCampaignContentInputSchema = z.object({
  content: z
    .string()
    .describe('The campaign or petition content to be moderated.'),
  contentType: z
    .enum(['campaign', 'petition'])
    .describe('The type of content being moderated.'),
});
export type ModerateCampaignContentInput = z.infer<
  typeof ModerateCampaignContentInputSchema
>;

const ModerateCampaignContentOutputSchema = z.object({
  isAppropriate: z
    .boolean()
    .describe('Whether the content is appropriate for the platform.'),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the appropriateness determination, including specific issues found or positive aspects noted.'
    ),
  revisedContent: z
    .string()
    .optional()
    .describe(
      'A revised version of the content, if necessary, to improve clarity or decency.'
    ),
});
export type ModerateCampaignContentOutput = z.infer<
  typeof ModerateCampaignContentOutputSchema
>;

export async function moderateCampaignContent(
  input: ModerateCampaignContentInput
): Promise<ModerateCampaignContentOutput> {
  return moderateCampaignContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateCampaignContentPrompt',
  input: {schema: ModerateCampaignContentInputSchema},
  output: {schema: ModerateCampaignContentOutputSchema},
  prompt: `You are an AI-powered content moderator for a social activism platform called RiseForGood.

  Your task is to review the following content and determine if it is appropriate for the platform.

  Consider the following criteria:
  - Appropriateness: The content should not contain hate speech, harassment, or any form of discrimination.
  - Clarity: The content should be clear, concise, and easy to understand.
  - Decency: The content should be respectful and not contain offensive language or imagery.

  Content Type: {{{contentType}}}
  Content: {{{content}}}

  Based on your review, provide the following information:
  - isAppropriate: A boolean value indicating whether the content is appropriate for the platform.
  - reasoning: A detailed explanation of your decision, including specific issues found or positive aspects noted.
  - revisedContent: If the content is not appropriate, provide a revised version of the content that addresses the issues.

  Ensure that your response is formatted as a JSON object that adheres to the ModerateCampaignContentOutputSchema schema.
  `,config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const moderateCampaignContentFlow = ai.defineFlow(
  {
    name: 'moderateCampaignContentFlow',
    inputSchema: ModerateCampaignContentInputSchema,
    outputSchema: ModerateCampaignContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
