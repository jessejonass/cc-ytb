import { ACCESS_LABELS, type AccessKind } from '@/lib/tmdb/availability'

export function AccessBadge({ kind }: { kind: AccessKind }) {
  return (
    <span className="rounded bg-bg/85 px-1.5 py-0.5 text-[11px] font-medium text-fg">
      {ACCESS_LABELS[kind]}
    </span>
  )
}
