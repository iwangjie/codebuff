/**
 * Local-only agent validation module.
 * 
 * This module validates agent definitions locally without any server communication.
 * All validation is performed using the common validation utilities.
 */

import {
  validateAgents as validateAgentsCommon,
} from '@codebuff/common/templates/agent-validation'
import type { AgentDefinition } from '@codebuff/common/templates/initial-agents-dir/types/agent-definition'

export interface ValidationResult {
  success: boolean
  validationErrors: Array<{
    id: string
    message: string
  }>
  errorCount: number
}

export interface ValidateAgentsOptions {
  /**
   * @deprecated Remote validation is not available in local-only mode.
   * This option is ignored.
   */
  remote?: boolean

  /**
   * @deprecated No server communication in local-only mode.
   * This option is ignored.
   */
  websiteUrl?: string
}

/**
 * Validates an array of agent definitions locally.
 *
 * Performs local Zod schema validation on all agent definitions.
 * In local-only mode, there is no remote validation available.
 *
 * @param definitions - Array of agent definitions to validate
 * @param _options - Deprecated, ignored in local-only mode
 * @returns Promise<ValidationResult> - Validation results with any errors
 *
 * @example
 * ```typescript
 * const result = await validateAgents(definitions)
 * if (!result.success) {
 *   console.error('Validation errors:', result.validationErrors)
 * }
 * ```
 */
export async function validateAgents(
  definitions: AgentDefinition[],
  _options?: ValidateAgentsOptions,
): Promise<ValidationResult> {
  // Convert array of definitions to Record<string, AgentDefinition> format
  // that the common validation functions expect
  // Use index as key to preserve all entries (including duplicates)
  const agentTemplates: Record<string, AgentDefinition> = {}
  for (const [index, definition] of definitions.entries()) {
    // Handle null/undefined gracefully
    if (!definition) {
      agentTemplates[`agent_${index}`] = definition
      continue
    }
    // Use index to ensure duplicates aren't overwritten
    const key = definition.id ? `${definition.id}_${index}` : `agent_${index}`
    agentTemplates[key] = definition
  }

  // Simple logger implementation for common validation functions
  const logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  }

  // Local validation only: use common package validation logic
  const result = validateAgentsCommon({
    agentTemplates,
    logger,
  })

  // Transform validation errors to the SDK format
  const transformedErrors = result.validationErrors.map((error) => ({
    id: error.filePath,
    message: error.message,
  }))

  return {
    success: transformedErrors.length === 0,
    validationErrors: transformedErrors,
    errorCount: transformedErrors.length,
  }
}
