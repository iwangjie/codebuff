import { isByokMode } from './constants/byok'
import {
  clientEnvSchema,
  clientProcessEnv,
  type ClientInput,
} from './env-schema'

const isTestRuntime =
  process.env.NODE_ENV === 'test' || process.env.BUN_ENV === 'test'

const DEFAULT_CLIENT_ENV: ClientInput = {
  NEXT_PUBLIC_CB_ENVIRONMENT: isTestRuntime ? 'test' : 'dev',
  NEXT_PUBLIC_CODEBUFF_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPPORT_EMAIL: 'support@codebuff.com',
  NEXT_PUBLIC_POSTHOG_API_KEY: 'local-posthog-disabled',
  NEXT_PUBLIC_POSTHOG_HOST_URL: 'https://us.i.posthog.com',
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_placeholder',
  NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL:
    'https://billing.stripe.com/p/login/test_placeholder',
  NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID: undefined,
  NEXT_PUBLIC_WEB_PORT: '3000',
}

const shouldDefaultClientEnv = isTestRuntime || isByokMode()

const isValidCbEnvironment = (value: string | undefined): boolean => {
  return value === 'dev' || value === 'test' || value === 'prod'
}

const isValidUrl = (value: string | undefined): boolean => {
  if (!value) return false
  try {
    // eslint-disable-next-line no-new
    new URL(value)
    return true
  } catch {
    return false
  }
}

const isValidEmail = (value: string | undefined): boolean => {
  if (!value) return false
  return value.includes('@')
}

const isValidNonEmptyString = (value: string | undefined): boolean => {
  return typeof value === 'string' && value.trim().length > 0
}

const isValidWebPort = (value: string | undefined): boolean => {
  if (!value) return false
  const num = Number(value)
  return Number.isFinite(num) && num >= 1000
}

const getDefaultedClientEnvInput = (): ClientInput => {
  const raw = clientProcessEnv

  // In local BYOK / tests, prefer safe defaults if the inherited shell env is
  // missing OR invalid (e.g. NEXT_PUBLIC_CB_ENVIRONMENT=development).
  return {
    NEXT_PUBLIC_CB_ENVIRONMENT: isValidCbEnvironment(raw.NEXT_PUBLIC_CB_ENVIRONMENT)
      ? raw.NEXT_PUBLIC_CB_ENVIRONMENT
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_CB_ENVIRONMENT,
    NEXT_PUBLIC_CODEBUFF_APP_URL: isValidUrl(raw.NEXT_PUBLIC_CODEBUFF_APP_URL)
      ? raw.NEXT_PUBLIC_CODEBUFF_APP_URL
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_CODEBUFF_APP_URL,
    NEXT_PUBLIC_SUPPORT_EMAIL: isValidEmail(raw.NEXT_PUBLIC_SUPPORT_EMAIL)
      ? raw.NEXT_PUBLIC_SUPPORT_EMAIL
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_SUPPORT_EMAIL,
    NEXT_PUBLIC_POSTHOG_API_KEY: isValidNonEmptyString(raw.NEXT_PUBLIC_POSTHOG_API_KEY)
      ? raw.NEXT_PUBLIC_POSTHOG_API_KEY
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_POSTHOG_API_KEY,
    NEXT_PUBLIC_POSTHOG_HOST_URL: isValidUrl(raw.NEXT_PUBLIC_POSTHOG_HOST_URL)
      ? raw.NEXT_PUBLIC_POSTHOG_HOST_URL
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_POSTHOG_HOST_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: isValidNonEmptyString(
      raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    )
      ? raw.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL: isValidUrl(
      raw.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL,
    )
      ? raw.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL,
    NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID:
      raw.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID ??
      DEFAULT_CLIENT_ENV.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION_ID,
    NEXT_PUBLIC_WEB_PORT: isValidWebPort(raw.NEXT_PUBLIC_WEB_PORT)
      ? raw.NEXT_PUBLIC_WEB_PORT
      : DEFAULT_CLIENT_ENV.NEXT_PUBLIC_WEB_PORT,
  }
}

const envInput = shouldDefaultClientEnv
  ? getDefaultedClientEnvInput()
  : clientProcessEnv

const parsedEnv = clientEnvSchema.safeParse(envInput)
if (!parsedEnv.success) {
  throw parsedEnv.error
}

export const env = parsedEnv.data

// Populate process.env with defaults so direct access works (tests + BYOK mode)
if (shouldDefaultClientEnv) {
  const withDefaults = getDefaultedClientEnvInput()
  for (const [key, value] of Object.entries(withDefaults)) {
    if (typeof value === 'string') {
      process.env[key] = value
    }
  }
}

// Only log environment in non-production
if (env.NEXT_PUBLIC_CB_ENVIRONMENT !== 'prod') {
  console.log('Using environment:', env.NEXT_PUBLIC_CB_ENVIRONMENT)
}

// Derived environment constants for convenience
export const IS_DEV = env.NEXT_PUBLIC_CB_ENVIRONMENT === 'dev'
export const IS_TEST = env.NEXT_PUBLIC_CB_ENVIRONMENT === 'test'
export const IS_PROD = env.NEXT_PUBLIC_CB_ENVIRONMENT === 'prod'
export const IS_CI = process.env.CODEBUFF_GITHUB_ACTIONS === 'true'

// Debug flag for logging analytics events in dev mode
// Set to true when actively debugging analytics - affects both CLI and backend
export const DEBUG_ANALYTICS = false
