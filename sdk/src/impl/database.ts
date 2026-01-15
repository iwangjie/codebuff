/**
 * Local-only database module for BYOK CLI.
 * 
 * This module provides stub implementations that work entirely locally
 * without any communication to the Codebuff backend server.
 * All agent definitions come from local .agents/ directories.
 */

import type {
  AddAgentStepFn,
  FetchAgentFromDatabaseFn,
  FinishAgentRunFn,
  GetUserInfoFromApiKeyInput,
  GetUserInfoFromApiKeyOutput,
  StartAgentRunFn,
  UserColumn,
} from '@codebuff/common/types/contracts/database'
import type { ParamsOf } from '@codebuff/common/types/function-params'

/**
 * Generate a local ID for runs and steps.
 */
function makeLocalId(prefix: string): string {
  const uuid = globalThis.crypto?.randomUUID?.()
  if (uuid) return `${prefix}-${uuid}`
  return `${prefix}-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`
}

/**
 * Get user info from API key.
 * In local-only mode, always returns null as there's no server to query.
 */
export async function getUserInfoFromApiKey<T extends UserColumn>(
  _params: GetUserInfoFromApiKeyInput<T>,
): GetUserInfoFromApiKeyOutput<T> {
  // Local-only mode: no server communication
  return null
}

/**
 * Fetch agent from database.
 * In local-only mode, always returns null. All agents come from local .agents/ directories.
 */
export async function fetchAgentFromDatabase(
  _params: ParamsOf<FetchAgentFromDatabaseFn>,
): ReturnType<FetchAgentFromDatabaseFn> {
  // Local-only mode: agents are loaded from local .agents/ directories only
  return null
}

/**
 * Start an agent run.
 * In local-only mode, returns a locally generated run ID.
 */
export async function startAgentRun(
  _params: ParamsOf<StartAgentRunFn>,
): ReturnType<StartAgentRunFn> {
  return makeLocalId('local-run')
}

/**
 * Finish an agent run.
 * In local-only mode, this is a no-op.
 */
export async function finishAgentRun(
  _params: ParamsOf<FinishAgentRunFn>,
): ReturnType<FinishAgentRunFn> {
  // Local-only mode: no-op
}

/**
 * Add an agent step.
 * In local-only mode, returns a locally generated step ID.
 */
export async function addAgentStep(
  _params: ParamsOf<AddAgentStepFn>,
): ReturnType<AddAgentStepFn> {
  return makeLocalId('local-step')
}
