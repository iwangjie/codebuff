import { describe, expect, test } from 'bun:test'

import { burstSafeInsertText } from '../burst-safe-text'

describe('burstSafeInsertText', () => {
  test('composes multiple synchronous inserts (IME burst)', () => {
    const valueRef = { current: '' }
    const cursorRef = { current: 0 }

    // Simulate an IME committing multiple characters faster than re-render.
    burstSafeInsertText({ valueRef, cursorRef, textToInsert: '你' })
    burstSafeInsertText({ valueRef, cursorRef, textToInsert: '好' })
    burstSafeInsertText({ valueRef, cursorRef, textToInsert: '师' })
    burstSafeInsertText({ valueRef, cursorRef, textToInsert: '姐' })

    expect(valueRef.current).toBe('你好师姐')
    expect(cursorRef.current).toBe(4)
  })

  test('replaces a range and updates cursor', () => {
    const valueRef = { current: 'hello world' }
    const cursorRef = { current: 11 }

    const next = burstSafeInsertText({
      valueRef,
      cursorRef,
      textToInsert: 'there',
      replaceRange: { start: 6, end: 11 },
    })

    expect(next).toEqual({ text: 'hello there', cursorPosition: 11 })
    expect(valueRef.current).toBe('hello there')
    expect(cursorRef.current).toBe(11)
  })
})

