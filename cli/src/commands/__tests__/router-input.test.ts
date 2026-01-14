import { describe, test, expect } from 'bun:test'

import { findCommand, COMMAND_REGISTRY } from '../command-registry'
import {
  normalizeInput,
  parseCommand,
  isSlashCommand,
} from '../router-utils'
import { SLASH_COMMANDS } from '../../data/slash-commands'

describe('router-utils', () => {
  describe('normalizeInput', () => {
    test('strips leading slash from input', () => {
      expect(normalizeInput('/help')).toBe('help')
      expect(normalizeInput('/exit')).toBe('exit')
    })

    test('preserves input without leading slash', () => {
      expect(normalizeInput('help')).toBe('help')
      expect(normalizeInput('some prompt text')).toBe('some prompt text')
    })

    test('handles empty string', () => {
      expect(normalizeInput('')).toBe('')
    })

    test('handles only slash', () => {
      expect(normalizeInput('/')).toBe('')
    })

    test('handles multiple slashes', () => {
      expect(normalizeInput('//help')).toBe('/help')
      expect(normalizeInput('///test')).toBe('//test')
    })

    test('preserves internal slashes', () => {
      expect(normalizeInput('/path/to/file')).toBe('path/to/file')
      expect(normalizeInput('path/to/file')).toBe('path/to/file')
    })

    test('preserves whitespace in input', () => {
      expect(normalizeInput('/help me')).toBe('help me')
      expect(normalizeInput('help me')).toBe('help me')
    })
  })

  describe('isSlashCommand', () => {
    test('returns true for input starting with /', () => {
      expect(isSlashCommand('/help')).toBe(true)
      expect(isSlashCommand('/exit')).toBe(true)
      expect(isSlashCommand('/')).toBe(true)
    })

    test('returns false for input not starting with /', () => {
      expect(isSlashCommand('help')).toBe(false)
      expect(isSlashCommand('exit')).toBe(false)
      expect(isSlashCommand('')).toBe(false)
    })

    test('handles whitespace correctly', () => {
      expect(isSlashCommand('  /help')).toBe(true)
      expect(isSlashCommand('  help')).toBe(false)
    })
  })

  describe('parseCommand', () => {
    test('extracts command from slashed input', () => {
      expect(parseCommand('/help')).toBe('help')
      expect(parseCommand('/exit')).toBe('exit')
      expect(parseCommand('/init')).toBe('init')
    })

    test('returns empty string for unslashed input (not a slash command)', () => {
      expect(parseCommand('help')).toBe('')
      expect(parseCommand('exit')).toBe('')
      expect(parseCommand('init')).toBe('')
      expect(parseCommand('login to my database')).toBe('')
    })

    test('extracts first word as command when there are arguments', () => {
      expect(parseCommand('/help me')).toBe('help')
      expect(parseCommand('/bash ls -la')).toBe('bash')
    })

    test('converts command to lowercase', () => {
      expect(parseCommand('/HELP')).toBe('help')
      expect(parseCommand('/EXIT')).toBe('exit')
      expect(parseCommand('/InIt')).toBe('init')
    })

    test('handles empty string', () => {
      expect(parseCommand('')).toBe('')
    })

    test('handles whitespace-only input', () => {
      expect(parseCommand('   ')).toBe('')
    })

    test('handles only slash', () => {
      expect(parseCommand('/')).toBe('')
    })

    test('handles multiple spaces between words', () => {
      expect(parseCommand('/help   me')).toBe('help')
    })
  })

  describe('slash commands only work with / prefix', () => {
    const slashCommands = [
      'exit',
      'clear',
      'new',
      'init',
      'bash',
      'feedback',
    ]

    for (const cmd of slashCommands) {
      test(`"/${cmd}" is recognized as slash command`, () => {
        expect(parseCommand(`/${cmd}`)).toBe(cmd)
      })

      test(`"${cmd}" without slash is NOT a slash command (sent to agent)`, () => {
        expect(parseCommand(cmd)).toBe('')
      })
    }
  })

  describe('words that look like commands but are not', () => {
    const nonCommands = [
      'login to my account',
      'I need help with logout functionality',
      'please help me',
      'usage of this function',
      'clear the database',
    ]

    for (const input of nonCommands) {
      test(`"${input}" is NOT a slash command`, () => {
        expect(parseCommand(input)).toBe('')
      })
    }
  })

})

describe('command-registry', () => {
  describe('findCommand', () => {
    test('finds command by name', () => {
      const exit = findCommand('exit')
      expect(exit).toBeDefined()
      expect(exit?.name).toBe('exit')
    })

    test('finds command by alias', () => {
      const quit = findCommand('quit')
      expect(quit).toBeDefined()
      expect(quit?.name).toBe('exit')
    })

    test('returns undefined for unknown command', () => {
      expect(findCommand('unknown')).toBeUndefined()
      expect(findCommand('notacommand')).toBeUndefined()
    })

    test('is case insensitive', () => {
      expect(findCommand('EXIT')?.name).toBe('exit')
      expect(findCommand('InIt')?.name).toBe('init')
    })
  })

  describe('COMMAND_REGISTRY', () => {
    test('all commands have unique names', () => {
      const names = COMMAND_REGISTRY.map((c) => c.name)
      const uniqueNames = new Set(names)
      expect(names.length).toBe(uniqueNames.size)
    })

    test('all aliases are unique across all commands', () => {
      const allAliases = COMMAND_REGISTRY.flatMap((c) => c.aliases)
      const uniqueAliases = new Set(allAliases)
      expect(allAliases.length).toBe(uniqueAliases.size)
    })

    test('no alias conflicts with command names', () => {
      const names = new Set(COMMAND_REGISTRY.map((c) => c.name))
      const allAliases = COMMAND_REGISTRY.flatMap((c) => c.aliases)
      for (const alias of allAliases) {
        expect(names.has(alias)).toBe(false)
      }
    })

    test('slash command metadata maps to registered commands', () => {
      const registered = new Set([
        ...COMMAND_REGISTRY.map((c) => c.name),
        ...COMMAND_REGISTRY.flatMap((c) => c.aliases),
      ])

      for (const slashCommand of SLASH_COMMANDS) {
        expect(registered.has(slashCommand.id)).toBe(true)
        for (const alias of slashCommand.aliases ?? []) {
          expect(registered.has(alias)).toBe(true)
        }
      }
    })
  })
})
