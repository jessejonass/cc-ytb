'use server'

import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import type { ActionResult } from '@/app/actions/favorites'
import { validateFavoriteInput, type FavoriteMovie } from '@/lib/favorite-input'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server'
import { isWatchStatus, type WatchStatus } from '@/lib/watch-status-input'

const MAX_INT4 = 2147483647

async function currentSession() {
  if (!isSupabaseConfigured()) return null
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.auth.getUser()
    return data.user ? { supabase, userId: data.user.id } : null
  } catch (e) {
    unstable_rethrow(e)
    return null
  }
}

function revalidateLists() {
  revalidatePath('/quero-assistir')
  revalidatePath('/assistidos')
}

export async function setWatchStatus(m: FavoriteMovie, status: WatchStatus): Promise<ActionResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: 'unauthenticated' }
  const input = validateFavoriteInput(m)
  if (!input || !isWatchStatus(status)) return { ok: false, error: 'failed' }
  try {
    const { error } = await session.supabase.from('watch_status').upsert(
      {
        user_id: session.userId,
        movie_id: input.movieId,
        status,
        title: input.title,
        poster_path: input.posterPath,
        release_year: input.releaseYear,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,movie_id' },
    )
    if (error) return { ok: false, error: 'failed' }
    revalidateLists()
    return { ok: true }
  } catch {
    return { ok: false, error: 'failed' }
  }
}

export async function clearWatchStatus(movieId: number): Promise<ActionResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: 'unauthenticated' }
  if (!Number.isInteger(movieId) || movieId <= 0 || movieId > MAX_INT4) {
    return { ok: false, error: 'failed' }
  }
  try {
    const { error } = await session.supabase
      .from('watch_status')
      .delete()
      .eq('user_id', session.userId)
      .eq('movie_id', movieId)
    if (error) return { ok: false, error: 'failed' }
    revalidateLists()
    return { ok: true }
  } catch {
    return { ok: false, error: 'failed' }
  }
}
