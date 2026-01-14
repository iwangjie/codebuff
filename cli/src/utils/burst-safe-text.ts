export type MutableRef<T> = { current: T }

export type TextReplaceRange = {
  start: number
  end: number
}

/**
 * Terminals + IMEs can emit a burst of character events faster than React state
 * propagation. If each event computes from a stale snapshot, intermediate
 * characters are effectively lost.
 *
 * This helper updates the provided refs optimistically so multiple synchronous
 * calls compose correctly.
 */
export function burstSafeInsertText(opts: {
  valueRef: MutableRef<string>
  cursorRef: MutableRef<number>
  textToInsert: string
  replaceRange?: TextReplaceRange | null
}): { text: string; cursorPosition: number } {
  const { valueRef, cursorRef, textToInsert, replaceRange } = opts

  if (!textToInsert) {
    return { text: valueRef.current, cursorPosition: cursorRef.current }
  }

  const value = valueRef.current
  const cursor = cursorRef.current

  if (replaceRange) {
    const start = Math.max(0, Math.min(replaceRange.start, value.length))
    const end = Math.max(start, Math.min(replaceRange.end, value.length))
    const text = value.slice(0, start) + textToInsert + value.slice(end)
    const cursorPosition = start + textToInsert.length
    valueRef.current = text
    cursorRef.current = cursorPosition
    return { text, cursorPosition }
  }

  const clampedCursor = Math.max(0, Math.min(cursor, value.length))
  const text = value.slice(0, clampedCursor) + textToInsert + value.slice(clampedCursor)
  const cursorPosition = clampedCursor + textToInsert.length
  valueRef.current = text
  cursorRef.current = cursorPosition
  return { text, cursorPosition }
}

