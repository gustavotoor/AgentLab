/**
 * Anthropic AI client wrapper using Vercel AI SDK.
 * Creates a model instance with the user's BYOK API key.
 */
import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Create an Anthropic model instance for use with Vercel AI SDK's streamText.
 * @param apiKey - The user's Anthropic API key (decrypted)
 * @returns A model instance configured for Claude Sonnet
 */
export function getAnthropicModel(apiKey: string) {
  const anthropic = createAnthropic({ apiKey });
  return anthropic("claude-sonnet-4-20250514");
}
