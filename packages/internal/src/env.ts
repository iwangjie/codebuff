import { isByokMode } from '@codebuff/common/constants/byok'

import { serverEnvSchema, getServerProcessEnv } from './env-schema'

// Only provide safe defaults in CI to avoid schema failures during tests
// In local dev, missing env vars should fail fast so devs know to configure them
const isCI = process.env.CI === 'true' || process.env.CI === '1'

// For local BYOK mode (fully local operation), keep env requirements minimal.
// We still provide defaults for all schema-required vars so importing web/internal
// packages doesn't require configuring auth/billing/analytics services.
const shouldProvideEnvDefaults = isCI || isByokMode()

if (shouldProvideEnvDefaults) {
  const ensureEnvDefault = (key: string, value: string) => {
    if (!process.env[key]) {
      process.env[key] = value
    }
  }

  const ensureEnvDefaultOrInvalid = (
    key: string,
    value: string,
    isValid: (current: string | undefined) => boolean,
  ) => {
    if (!isValid(process.env[key])) {
      process.env[key] = value
    }
  }

  const isValidCbEnvironment = (v: string | undefined) =>
    v === 'dev' || v === 'test' || v === 'prod'
  const isValidUrl = (v: string | undefined) => {
    if (!v) return false
    try {
      // eslint-disable-next-line no-new
      new URL(v)
      return true
    } catch {
      return false
    }
  }
  const isValidEmail = (v: string | undefined) => Boolean(v && v.includes('@'))
  const isValidWebPort = (v: string | undefined) => {
    if (!v) return false
    const num = Number(v)
    return Number.isFinite(num) && num >= 1000
  }

  // Client/public env (required by clientEnvSchema)
  ensureEnvDefaultOrInvalid(
    'NEXT_PUBLIC_CB_ENVIRONMENT',
    isCI ? 'test' : 'dev',
    isValidCbEnvironment,
  )
  ensureEnvDefaultOrInvalid(
    'NEXT_PUBLIC_CODEBUFF_APP_URL',
    'http://localhost:3000',
    isValidUrl,
  )
  ensureEnvDefaultOrInvalid(
    'NEXT_PUBLIC_SUPPORT_EMAIL',
    'support@codebuff.com',
    isValidEmail,
  )
  ensureEnvDefault('NEXT_PUBLIC_POSTHOG_API_KEY', 'local-posthog-disabled')
  ensureEnvDefaultOrInvalid(
    'NEXT_PUBLIC_POSTHOG_HOST_URL',
    'https://us.i.posthog.com',
    isValidUrl,
  )
  ensureEnvDefault('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_placeholder')
  ensureEnvDefaultOrInvalid(
    'NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL',
    'https://billing.stripe.com/p/login/test_placeholder',
    isValidUrl,
  )
  ensureEnvDefaultOrInvalid('NEXT_PUBLIC_WEB_PORT', '3000', isValidWebPort)

  // Server env
  ensureEnvDefault('OPEN_ROUTER_API_KEY', 'test')
  ensureEnvDefault('OPENAI_API_KEY', 'test')
  ensureEnvDefault('ANTHROPIC_API_KEY', 'test')
  ensureEnvDefault('LINKUP_API_KEY', 'test')
  ensureEnvDefault('GRAVITY_API_KEY', 'test')
  ensureEnvDefault('PORT', '4242')
  ensureEnvDefault('DATABASE_URL', 'postgres://user:pass@localhost:5432/db')
  ensureEnvDefault('CODEBUFF_GITHUB_ID', 'test-id')
  ensureEnvDefault('CODEBUFF_GITHUB_SECRET', 'test-secret')
  ensureEnvDefault('NEXTAUTH_SECRET', 'test-secret')
  ensureEnvDefault('STRIPE_SECRET_KEY', 'sk_test_dummy')
  ensureEnvDefault('STRIPE_WEBHOOK_SECRET_KEY', 'whsec_dummy')
  ensureEnvDefault('STRIPE_USAGE_PRICE_ID', 'price_test')
  ensureEnvDefault('STRIPE_TEAM_FEE_PRICE_ID', 'price_test')
  ensureEnvDefault('LOOPS_API_KEY', 'test')
  ensureEnvDefault('DISCORD_PUBLIC_KEY', 'test')
  ensureEnvDefault('DISCORD_BOT_TOKEN', 'test')
  ensureEnvDefault('DISCORD_APPLICATION_ID', 'test')
}

// Only log environment in non-production
if (process.env.NEXT_PUBLIC_CB_ENVIRONMENT !== 'prod') {
  console.log('Using environment:', process.env.NEXT_PUBLIC_CB_ENVIRONMENT)
}

export const env = serverEnvSchema.parse(getServerProcessEnv())
