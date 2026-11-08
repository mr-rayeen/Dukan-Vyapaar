let counter = 0;

/**
 * Generates guaranteed unique IDs across the entire app
 * even when called multiple times within the exact same millisecond.
 */
export function generateUniqueId(prefix: string = 'id'): string {
  counter = (counter + 1) % 1000000;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${counter}-${random}`;
}
