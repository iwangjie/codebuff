/**
 * Normalize user input by stripping the leading slash if present.
 * @example
 * normalizeInput('/help') // => 'help'
 * normalizeInput('help')  // => 'help'
 */
export function normalizeInput(input: string): string {
  return input.startsWith('/') ? input.slice(1) : input
}

/**
 * Check if the input is a slash command (starts with '/').
 *
 * @example
 * isSlashCommand('/help') // => true
 * isSlashCommand('help')  // => false
 */
export function isSlashCommand(input: string): boolean {
  return input.trim().startsWith('/')
}

/**
 * Parse the command name from user input.
 * ONLY works for slash commands (input starting with '/').
 * Returns empty string if the input is not a slash command.
 *
 * @example
 * parseCommand('/help') // => 'help'
 * parseCommand('/EXIT') // => 'exit'
 * parseCommand('/usage stats') // => 'usage'
 * parseCommand('help') // => '' (not a slash command)
 * parseCommand('exit') // => '' (not a slash command)
 */
export function parseCommand(input: string): string {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) {
    return ''
  }
  const normalized = trimmed.slice(1)
  const firstWord = normalized.split(/\s+/)[0] || ''
  return firstWord.toLowerCase()
}
