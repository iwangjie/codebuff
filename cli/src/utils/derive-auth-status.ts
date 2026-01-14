import { getErrorStatusCode, isRetryableStatusCode } from '@codebuff/sdk'

import type { AuthStatus } from './status-indicator-state'

export type AuthQueryLike = {
  isError: boolean
  error: unknown
  failureCount?: number
  fetchStatus?: 'fetching' | 'paused' | 'idle'
  isFetching?: boolean
}

/**
 * Derive a minimal auth/network status for the status bar.
 *
 * Important: only show "retrying" when a retry is actually in-flight.
 * Otherwise, treat retryable failures as "unreachable" until the next refetch.
 */
export function deriveAuthStatusFromAuthQuery(authQuery: AuthQueryLike): AuthStatus {
  const error = authQuery.error
  const statusCode = error ? getErrorStatusCode(error) : undefined

  const isFetching =
    authQuery.fetchStatus === 'fetching' || authQuery.isFetching === true
  const failureCount = authQuery.failureCount ?? 0

  if (
    isRetryableStatusCode(statusCode) &&
    isFetching &&
    failureCount > 0
  ) {
    return 'retrying'
  }

  if (authQuery.isError && statusCode !== undefined) {
    if (isRetryableStatusCode(statusCode) || statusCode >= 500) {
      return 'unreachable'
    }
  }

  return 'ok'
}

