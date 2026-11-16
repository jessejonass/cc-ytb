// Pura (sem server-only): usada pelas actions e pelo componente cliente.
export type WatchStatus = 'quero' | 'assistido'

export const WATCH_STATUSES: readonly WatchStatus[] = ['quero', 'assistido']

export function isWatchStatus(v: unknown): v is WatchStatus {
  return typeof v === 'string' && (WATCH_STATUSES as readonly string[]).includes(v)
}

/** Interruptor: clicar no estado ativo limpa; clicar no outro troca. */
export function nextWatchAction(
  current: WatchStatus | null,
  clicked: WatchStatus,
): { kind: 'set'; status: WatchStatus } | { kind: 'clear' } {
  return current === clicked ? { kind: 'clear' } : { kind: 'set', status: clicked }
}
