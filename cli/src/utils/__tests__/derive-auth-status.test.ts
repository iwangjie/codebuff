import { describe, expect, test } from 'bun:test'

import { deriveAuthStatusFromAuthQuery } from '../derive-auth-status'

const httpError = (statusCode: number) =>
  Object.assign(new Error(`HTTP ${statusCode}`), { statusCode })

describe('deriveAuthStatusFromAuthQuery', () => {
  test('returns ok when there is no error', () => {
    expect(
      deriveAuthStatusFromAuthQuery({
        isError: false,
        error: undefined,
        fetchStatus: 'idle',
        failureCount: 0,
      }),
    ).toBe('ok')
  })

  test('returns retrying only when fetching with prior failures', () => {
    expect(
      deriveAuthStatusFromAuthQuery({
        isError: true,
        error: httpError(503),
        fetchStatus: 'fetching',
        failureCount: 1,
      }),
    ).toBe('retrying')
  })

  test('returns unreachable when retryable error is present but not actively fetching', () => {
    expect(
      deriveAuthStatusFromAuthQuery({
        isError: true,
        error: httpError(503),
        fetchStatus: 'idle',
        failureCount: 3,
      }),
    ).toBe('unreachable')
  })

  test('returns ok for authentication errors (401/403) even if isError', () => {
    expect(
      deriveAuthStatusFromAuthQuery({
        isError: true,
        error: httpError(401),
        fetchStatus: 'idle',
        failureCount: 0,
      }),
    ).toBe('ok')
    expect(
      deriveAuthStatusFromAuthQuery({
        isError: true,
        error: httpError(403),
        fetchStatus: 'idle',
        failureCount: 0,
      }),
    ).toBe('ok')
  })
})

