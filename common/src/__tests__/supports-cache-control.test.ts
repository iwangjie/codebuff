import { describe, test, expect } from 'bun:test'

import { models, supportsCacheControl } from '../old-constants'

describe('supportsCacheControl', () => {
  test('enables cache control for OpenAI and Anthropic model prefixes', () => {
    expect(supportsCacheControl('openai/gpt-4.1')).toBe(true)
    expect(supportsCacheControl('anthropic/claude-3.7-sonnet')).toBe(true)
  })

  test('enables cache control for provider-prefixed OpenRouter model IDs, even if not hardcoded', () => {
    expect(supportsCacheControl('x-ai/grok-4.1-fast')).toBe(true)
    expect(supportsCacheControl('qwen/qwen3-coder')).toBe(true)
  })

  test('keeps explicit non-cacheable models disabled', () => {
    expect(supportsCacheControl(models.openrouter_grok_4)).toBe(false)
  })

  test('defaults to false for unknown, non-prefixed model ids', () => {
    expect(supportsCacheControl('totally-unknown-model')).toBe(false)
  })
})

