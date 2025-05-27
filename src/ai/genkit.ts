
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import type { GenkitPlugin } from 'genkit';

// Check for GEMINI_API_KEY or GOOGLE_API_KEY
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

const plugins: GenkitPlugin[] = [];
let defaultModel: string | undefined = undefined;

if (apiKey) {
  // If an API key is found, load the Google AI plugin and set the default model.
  // The googleAI() constructor will automatically pick up the API key from the environment.
  plugins.push(googleAI());
  defaultModel = 'googleai/gemini-2.0-flash';
  console.log('Google AI plugin loaded successfully.');
} else {
  // If no API key is found, log a warning.
  // The app will still start, but AI features relying on Google models will not be available.
  console.warn(
    'WARNING: GEMINI_API_KEY or GOOGLE_API_KEY is not set in the environment. ' +
    'The Google AI plugin will not be loaded. ' +
    'AI features relying on Google models will not function.'
  );
}

export const ai = genkit({
  plugins: plugins,
  model: defaultModel, // Default model will be undefined if the plugin isn't loaded
});
