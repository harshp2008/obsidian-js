/**
 * Checks if any of the cursor positions fall within or immediately adjacent to the given range.
 * @param cursorPositions - An array of cursor positions.
 * @param rangeFrom - The start of the range to check.
 * @param rangeTo - The end of the range to check.
 * @param proximity - How close the cursor needs to be to be considered "near". Defaults to 1 (adjacent).
 * @returns True if any cursor is near the range, false otherwise.
 */
export function isCursorNearRange(cursorPositions: number[], rangeFrom: number, rangeTo: number, proximity: number = 0): boolean {
  

  for (const cursor of cursorPositions) {
    if (cursor >= rangeFrom - (proximity) && cursor <= rangeTo + (proximity)) {
      return true;
    }
  }
  return false;
}

/**
 * Escapes special characters in a string for use in a regular expression.
 * @param str - The string to escape.
 * @returns The escaped string.
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}
