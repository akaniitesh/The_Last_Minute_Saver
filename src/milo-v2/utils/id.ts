/**
 * Safe unique ID generation helper.
 */
export function generateId(prefix: string = "milo"): string {
  const timestamp = Date.now().toString(36);
  const randomChars = Math.random().toString(36).substring(2, 9);
  return `${prefix}-${timestamp}-${randomChars}`;
}
