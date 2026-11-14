import type { TmdbWatchRegion } from './types'

export type AccessKind = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy'

export const ACCESS_LABELS: Record<AccessKind, string> = {
  flatrate: 'Assinatura',
  free: 'Grátis',
  ads: 'Com anúncios',
  rent: 'Aluguel',
  buy: 'Compra',
}

const ACCESS_ORDER: AccessKind[] = ['flatrate', 'free', 'ads', 'rent', 'buy']

export type Availability = {
  available: boolean
  link: string | null
  kinds: AccessKind[]
  groups: {
    kind: AccessKind
    label: string
    providers: { id: number; name: string; logoPath: string | null }[]
  }[]
}

export function summarizeAvailability(
  region: TmdbWatchRegion | undefined,
): Availability {
  const groups: Availability['groups'] = []
  for (const kind of ACCESS_ORDER) {
    const list = region?.[kind]
    if (!list || list.length === 0) continue
    groups.push({
      kind,
      label: ACCESS_LABELS[kind],
      providers: [...list]
        .sort((a, b) => a.display_priority - b.display_priority)
        .map((p) => ({ id: p.provider_id, name: p.provider_name, logoPath: p.logo_path })),
    })
  }
  return {
    available: groups.length > 0,
    link: region?.link ?? null,
    kinds: groups.map((g) => g.kind),
    groups,
  }
}
