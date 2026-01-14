import fs from 'fs'
import path from 'path'

import { getConfigDir } from './auth'
import { AGENT_MODES } from './constants'
import { logger } from './logger'

import type { AgentMode } from './constants'

/**
 * Settings schema - add new settings here as the product evolves
 */
export interface Settings {
  mode?: AgentMode
  adsEnabled?: boolean
  byokOpenrouter?: string
  byokOpenrouterBaseUrl?: string
}

/**
 * Get the settings file path (primary, environment-specific)
 */
export const getSettingsPath = (): string => {
  return path.join(getConfigDir(), 'settings.json')
}

/**
 * Get all settings file paths in precedence order.
 *
 * - Base/prod config: ~/.config/manicode/settings.json
 * - Env-specific override: ~/.config/manicode-<env>/settings.json
 *
 * This keeps backwards compatibility with older setups that stored settings
 * in the non-suffixed directory even when running in dev/test.
 */
const getAllSettingsPaths = (): string[] => {
  const primary = getSettingsPath()

  // getConfigDir() already includes the env suffix (manicode-dev, etc).
  // For compatibility, also check the prod directory.
  const prodPath = path.join(
    path.dirname(path.dirname(primary)),
    'manicode',
    'settings.json',
  )

  // Merge base then override (env-specific should win)
  if (primary === prodPath) return [primary]
  return [prodPath, primary]
}

/**
 * Load all settings from file system
 * @returns The saved settings object, with defaults for missing values
 */
export const loadSettings = (): Settings => {
  const paths = getAllSettingsPaths()
  let merged: Settings = {}

  for (const settingsPath of paths) {
    if (!fs.existsSync(settingsPath)) {
      continue
    }

    try {
      const settingsFile = fs.readFileSync(settingsPath, 'utf8')
      const parsed = JSON.parse(settingsFile)
      merged = { ...merged, ...validateSettings(parsed) }
    } catch (error) {
      logger.debug(
        {
          error: error instanceof Error ? error.message : String(error),
          settingsPath,
        },
        'Error reading settings',
      )
    }
  }

  return merged
}

/**
 * Validate and sanitize settings from file
 */
const validateSettings = (parsed: unknown): Settings => {
  if (typeof parsed !== 'object' || parsed === null) {
    return {}
  }

  const settings: Settings = {}
  const obj = parsed as Record<string, unknown>

  // Validate mode
  if (
    typeof obj.mode === 'string' &&
    AGENT_MODES.includes(obj.mode as AgentMode)
  ) {
    settings.mode = obj.mode as AgentMode
  }

  // Validate adsEnabled
  if (typeof obj.adsEnabled === 'boolean') {
    settings.adsEnabled = obj.adsEnabled
  }

  if (typeof obj.byokOpenrouter === 'string' && obj.byokOpenrouter.trim()) {
    settings.byokOpenrouter = obj.byokOpenrouter
  }

  if (
    typeof obj.byokOpenrouterBaseUrl === 'string' &&
    obj.byokOpenrouterBaseUrl.trim()
  ) {
    settings.byokOpenrouterBaseUrl = obj.byokOpenrouterBaseUrl
  }

  return settings
}

/**
 * Save settings to file system (merges with existing settings)
 */
export const saveSettings = (newSettings: Partial<Settings>): void => {
  const configDir = getConfigDir()
  const settingsPath = getSettingsPath()

  try {
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }

    // Load existing settings and merge
    const existingSettings = loadSettings()
    const mergedSettings = { ...existingSettings, ...newSettings }

    fs.writeFileSync(settingsPath, JSON.stringify(mergedSettings, null, 2))
  } catch (error) {
    logger.debug(
      {
        error: error instanceof Error ? error.message : String(error),
      },
      'Error saving settings',
    )
  }
}

/**
 * Load the saved agent mode preference
 * @returns The saved mode, or 'DEFAULT' if not found or invalid
 */
export const loadModePreference = (): AgentMode => {
  const settings = loadSettings()
  return settings.mode ?? 'DEFAULT'
}

/**
 * Save the agent mode preference
 */
export const saveModePreference = (mode: AgentMode): void => {
  saveSettings({ mode })
}
