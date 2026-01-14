export const BYOK_OPENROUTER_HEADER = 'x-openrouter-api-key'
export const BYOK_OPENROUTER_ENV_VAR = 'CODEBUFF_BYOK_OPENROUTER'
export const BYOK_OPENROUTER_BASE_URL_ENV_VAR =
  'CODEBUFF_BYOK_OPENROUTER_BASE_URL'

/**
 * Check if BYOK (Bring Your Own Key) mode is enabled.
 * BYOK mode is active when the OpenRouter-compatible base URL is set.
 * The API key is optional (some local proxies don't require it).
 * In this mode, all model requests go directly to OpenRouter, bypassing Codebuff backend.
 */
export function isByokMode(): boolean {
  return Boolean(
    process.env[BYOK_OPENROUTER_BASE_URL_ENV_VAR],
  )
}
