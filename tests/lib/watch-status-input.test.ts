import { describe, expect, it } from 'vitest'
import { isWatchStatus, nextWatchAction, WATCH_STATUSES } from '@/lib/watch-status-input'

describe('watch-status-input', () => {
  it('WATCH_STATUSES', () => {
    expect(WATCH_STATUSES).toEqual(['quero', 'assistido'])
  })

  it('isWatchStatus', () => {
    expect(isWatchStatus('quero')).toBe(true)
    expect(isWatchStatus('assistido')).toBe(true)
    for (const v of ['xyz', '', null, undefined, 1, 'QUERO']) expect(isWatchStatus(v)).toBe(false)
  })

  it('nextWatchAction', () => {
    expect(nextWatchAction(null, 'quero')).toEqual({ kind: 'set', status: 'quero' })
    expect(nextWatchAction('quero', 'assistido')).toEqual({ kind: 'set', status: 'assistido' })
    expect(nextWatchAction('assistido', 'quero')).toEqual({ kind: 'set', status: 'quero' })
    expect(nextWatchAction('assistido', 'assistido')).toEqual({ kind: 'clear' })
    expect(nextWatchAction('quero', 'quero')).toEqual({ kind: 'clear' })
  })
})
