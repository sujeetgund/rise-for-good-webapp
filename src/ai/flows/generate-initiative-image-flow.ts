
'use server';
/**
 * @fileOverview An AI flow for generating images for initiatives based on text prompts.
 *
 * - generateInitiativeImage - A function that handles the image generation process.
 * - GenerateInitiativeImageInput - The input type for the generateInitiativeImage function.
 * - GenerateInitiativeImageOutput - The return type for the generateInitiativeImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitiativeImageInputSchema = z.object({
  prompt: z.string().describe('A text prompt to generate an image from.'),
});
export type GenerateInitiativeImageInput = z.infer<
  typeof GenerateInitiativeImageInputSchema
>;

const GenerateInitiativeImageOutputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The generated image as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateInitiativeImageOutput = z.infer<
  typeof GenerateInitiativeImageOutputSchema
>;

export async function generateInitiativeImage(
  input: GenerateInitiativeImageInput
): Promise<GenerateInitiativeImageOutput> {
  return generateInitiativeImageFlow(input);
}

const generateInitiativeImageFlow = ai.defineFlow(
  {
    name: 'generateInitiativeImageFlow',
    inputSchema: GenerateInitiativeImageInputSchema,
    outputSchema: GenerateInitiativeImageOutputSchema,
  },
  async (input: GenerateInitiativeImageInput) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-exp',
      prompt: input.prompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
         safetySettings: [ // Add safety settings to reduce blocking
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
        ],
      },
    });

    if (!media?.url) {
      throw new Error(
        'Image generation failed or returned no media URL. The prompt might have been blocked by safety filters or an internal error occurred.'
      );
    }
    return { imageDataUri: media.url };
  }
);
