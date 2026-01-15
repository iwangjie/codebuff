export const BYOK_OPENROUTER_HEADER = 'x-openrouter-api-key'
export const BYOK_OPENROUTER_ENV_VAR = 'CODEBUFF_BYOK_OPENROUTER'
export const BYOK_OPENROUTER_BASE_URL_ENV_VAR =
  'CODEBUFF_BYOK_OPENROUTER_BASE_URL'

/**
 * Check if BYOK (Bring Your Own Key) mode is enabled.
 * 
 * In the local-only CLI build, BYOK mode is always enabled.
 * All model requests go directly to OpenRouter (or other compatible providers),
 * bypassing any Codebuff backend communication.
 */
export function isByokMode(): boolean {
  return true
}
