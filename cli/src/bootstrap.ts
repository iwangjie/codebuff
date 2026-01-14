#!/usr/bin/env bun

import fs from 'fs'
import os from 'os'
import path from 'path'

type JsonObject = Record<string, unknown>

const isObject = (value: unknown): value is JsonObject => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const readJsonFile = (filePath: string): JsonObject | null => {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return isObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

const guessCbEnvironment = (): 'dev' | 'test' | 'prod' => {
  const explicit = process.env.NEXT_PUBLIC_CB_ENVIRONMENT
  if (explicit === 'dev' || explicit === 'test' || explicit === 'prod') {
    return explicit
  }
  const isTest =
    process.env.NODE_ENV === 'test' ||
    process.env.BUN_ENV === 'test' ||
    process.env.CI === 'true' ||
    process.env.CI === '1'
  return isTest ? 'test' : 'dev'
}

const getSettingsPaths = (): string[] => {
  const env = guessCbEnvironment()
  const homeConfigBase = path.join(os.homedir(), '.config')
  const projectConfigBase = path.join(process.cwd(), '.config')

  const names =
    env === 'prod' ? ['manicode'] : ['manicode', `manicode-${env}`]

  const pathsToTry: string[] = []
  for (const name of names) {
    // Home config: ~/.config/manicode[/settings.json]
    pathsToTry.push(path.join(homeConfigBase, name, 'settings.json'))
  }
  for (const name of names) {
    // Project config: <cwd>/.config/manicode[/settings.json]
    pathsToTry.push(path.join(projectConfigBase, name, 'settings.json'))
  }

  // For local dev stacks, also fall back to prod config for compatibility.
  if (env !== 'prod') {
    pathsToTry.push(path.join(homeConfigBase, 'manicode', 'settings.json'))
    pathsToTry.push(path.join(projectConfigBase, 'manicode', 'settings.json'))
  }

  // Dedupe, keep order
  return [...new Set(pathsToTry)]
}

const mergeSettings = (base: JsonObject, override: JsonObject): JsonObject => {
  return { ...base, ...override }
}

const loadMergedSettings = (): JsonObject => {
  const paths = getSettingsPaths()

  let merged: JsonObject = {}
  for (const filePath of paths) {
    const json = readJsonFile(filePath)
    if (json) {
      merged = mergeSettings(merged, json)
    }
  }
  return merged
}

const getSettingString = (settings: JsonObject, key: string): string | null => {
  const direct = settings[key]
  if (typeof direct === 'string' && direct.trim().length > 0) return direct

  const envObj = settings.env
  if (isObject(envObj)) {
    const nested = envObj[key]
    if (typeof nested === 'string' && nested.trim().length > 0) return nested
  }

  return null
}

const applyEnvFromSettings = (): void => {
  const settings = loadMergedSettings()

  const byokOpenrouter =
    getSettingString(settings, 'CODEBUFF_BYOK_OPENROUTER') ??
    getSettingString(settings, 'byokOpenrouter')
  const byokOpenrouterBaseUrl =
    getSettingString(settings, 'CODEBUFF_BYOK_OPENROUTER_BASE_URL') ??
    getSettingString(settings, 'byokOpenrouterBaseUrl')

  if (!process.env.CODEBUFF_BYOK_OPENROUTER && byokOpenrouter) {
    process.env.CODEBUFF_BYOK_OPENROUTER = byokOpenrouter
  }
  if (
    !process.env.CODEBUFF_BYOK_OPENROUTER_BASE_URL &&
    byokOpenrouterBaseUrl
  ) {
    process.env.CODEBUFF_BYOK_OPENROUTER_BASE_URL = byokOpenrouterBaseUrl
  }
}

applyEnvFromSettings()

await import('./index.tsx')
