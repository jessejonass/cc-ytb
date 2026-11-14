export function formatRating(voteAverage: number, voteCount: number): string {
  if (!voteCount || !voteAverage) return 'Sem nota'
  return voteAverage.toFixed(1).replace('.', ',')
}

export function isNumericRating(rating: string): boolean {
  return /^\d+,\d$/.test(rating)
}

/** "8,1" → "★ 8,1"; "Sem nota" fica sem estrela; vazio → null. */
export function ratingLabel(rating: string): string | null {
  if (!rating) return null
  return isNumericRating(rating) ? `★ ${rating}` : rating
}

export function formatRuntime(minutes: number | null): string | null {
  if (!minutes || minutes <= 0) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return `${h}h ${String(m).padStart(2, '0')}min`
}

export function releaseYear(date: string | undefined | null): string | null {
  if (!date) return null
  const year = date.slice(0, 4)
  return /^\d{4}$/.test(year) ? year : null
}
