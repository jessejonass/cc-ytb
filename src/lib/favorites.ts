import 'server-only'
import { unstable_rethrow } from 'next/navigation'
import { createServerSupabase, getCurrentUser } from '@/lib/supabase/server'
import type { MovieCard } from '@/lib/tmdb/movies'

type Row = {
  movie_id: number
  title: string
  poster_path: string | null
  release_year: string | null
}

export async function getFavoriteIds(): Promise<Set<number>> {
  try {
    const user = await getCurrentUser()
    if (!user) return new Set()
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.from('favorites').select('movie_id')
    if (error || !data) return new Set()
    return new Set((data as { movie_id: number }[]).map((r) => r.movie_id))
  } catch (e) {
    unstable_rethrow(e)
    return new Set()
  }
}

export async function listFavorites(): Promise<MovieCard[]> {
  try {
    const user = await getCurrentUser()
    if (!user) return []
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('favorites')
      .select('movie_id,title,poster_path,release_year')
      .order('created_at', { ascending: false })
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
