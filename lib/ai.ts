import { createAnthropic } from '@ai-sdk/anthropic'

/**
 * Creates an Anthropic AI client with the provided API key.
 * Used for BYOK (Bring Your Own Key) functionality.
 * @param {string} apiKey - The user's Anthropic API key
 * @returns Anthropic client configured with the user's key
 */
export function createAnthropicClient(apiKey: string) {
  return createAnthropic({
    apiKey,
  })
}

/**
 * Returns the default Claude model to use for chat.
 * @returns {string} The model identifier
 */
export function getDefaultModel(): string {
  return 'claude-sonnet-4-6'
}

/**
 * Creates an Anthropic model instance for a given user API key.
 * @param {string} apiKey - The user's decrypted Anthropic API key
 * @param {string} [model] - Optional model override
 * @returns Anthropic language model instance
 */
export function createModel(apiKey: string, model?: string) {
  const anthropic = createAnthropicClient(apiKey)
  return anthropic(model ?? getDefaultModel())
}
