import 'server-only'
import { unstable_rethrow } from 'next/navigation'
import { createServerSupabase, getCurrentUser } from '@/lib/supabase/server'
import type { MovieCard } from '@/lib/tmdb/movies'
import { isWatchStatus, type WatchStatus } from '@/lib/watch-status-input'

type Row = {
  movie_id: number
  title: string
  poster_path: string | null
  release_year: string | null
}

export async function getWatchStatus(movieId: number): Promise<WatchStatus | null> {
  try {
    const user = await getCurrentUser()
    if (!user) return null
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('watch_status')
      .select('status')
      .eq('movie_id', movieId)
      .maybeSingle()
    if (error || !data) return null
    const status = (data as { status: unknown }).status
    return isWatchStatus(status) ? status : null
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
}

/** Filmes da pessoa num estado, do marcado mais recentemente ao mais antigo. */
export async function listByStatus(status: WatchStatus): Promise<MovieCard[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('watch_status')
      .select('movie_id,title,poster_path,release_year')
      .eq('status', status)
      .order('updated_at', { ascending: false })
    if (error || !data) return []
    return (data as Row[]).map(
      (r): MovieCard => ({
        id: r.movie_id,
        title: r.title,
        posterPath: r.poster_path,
        backdropPath: null,
        overview: '',
        year: r.release_year,
        rating: '',
      }),
    )
  } catch (e) {
    unstable_rethrow(e)
    return []
  }
}
