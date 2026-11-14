export function safeNextPath(next: unknown): string {
  if (typeof next !== 'string' || !next.startsWith('/')) return '/'
  if (next.startsWith('//')) return '/'
  // control characters, whitespace and backslashes are stripped or rewritten by browsers
  if (/[\x00-\x1F\x7F\s\\]/.test(next)) return '/'
  try {
    const base = 'http://x'
    const url = new URL(next, base)
    if (url.origin !== base) return '/'
  } catch {
    return '/'
  }
  return next
}
