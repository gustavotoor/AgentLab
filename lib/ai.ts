import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

/**
 * Creates an Anthropic AI client with the provided API key.
 */
export function createAnthropicClient(apiKey: string) {
  return createAnthropic({ apiKey })
}

/**
 * Creates an OpenAI client with the provided API key.
 */
export function createOpenAIClient(apiKey: string) {
  return createOpenAI({ apiKey })
}

/**
 * Returns the default model for a given provider.
 */
export function getDefaultModel(): string {
  return 'claude-sonnet-4-6'
}

export function getDefaultModelForProvider(provider: string): string {
  return provider === 'openai' ? 'gpt-5' : 'claude-sonnet-4-6'
}

/**
 * Creates a language model instance for the given provider and API key.
 * GPT-5.x and o-series models use the OpenAI Responses API (openai.responses())
 * which is required for the new model generation.
 */
export function createModelForProvider(apiKey: string, provider: string, model?: string) {
  if (provider === 'openai') {
    const openai = createOpenAIClient(apiKey)
    const modelId = model ?? 'gpt-5'
    // Responses API is required for GPT-5.x and o3/o4 series
    return openai.responses(modelId)
  }
  const anthropic = createAnthropicClient(apiKey)
  return anthropic(model ?? getDefaultModel())
}

/**
 * @deprecated Use createModelForProvider instead.
 */
export function createModel(apiKey: string, model?: string) {
  return createModelForProvider(apiKey, 'anthropic', model)
}
