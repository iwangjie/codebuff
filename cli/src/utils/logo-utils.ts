/**
 * Determines the color for a character based on its position relative to the sheen.
 * Block characters use blockColor, shadow/border characters animate to accent color.
 */
export function getSheenColor(
  char: string,
  charIndex: number,
  sheenPosition: number,
  logoColor: string,
  shadowChars: Set<string>,
  accentColor: string,
  blockColor: string,
  isReversing: boolean,
): string {
  if (char === '█') {
    return blockColor
  }

  if (!shadowChars.has(char)) {
    return logoColor
  }

  if (isReversing) {
    if (charIndex <= sheenPosition) {
      return logoColor
    }
    return accentColor
  }

  if (charIndex <= sheenPosition) {
    return accentColor
  }
  return logoColor
}

/**
 * Parses the logo string into individual non-empty lines.
 */
export function parseLogoLines(logo: string): string[] {
  return logo.split('\n').filter((line) => line.length > 0)
}
