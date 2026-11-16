import { ACCESS_LABELS, type AccessKind } from '@/lib/tmdb/availability'

export function AccessBadge({ kind }: { kind: AccessKind }) {
  return (
    <span className="rounded-md bg-black/55 px-1.5 py-0.5 text-[11px] font-semibold text-fg ring-1 ring-white/15 backdrop-blur-md">
      {ACCESS_LABELS[kind]}
    </span>
  )
}
