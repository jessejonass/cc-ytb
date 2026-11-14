'use server'

import { revalidatePath } from 'next/cache'
import { unstable_rethrow } from 'next/navigation'
import { createServerSupabase, isSupabaseConfigured } from '@/lib/supabase/server'
import { validateFavoriteInput } from '@/lib/favorite-input'
import type { FavoriteMovie } from '@/lib/favorite-input'

export type ActionResult = { ok: true } | { ok: false; error: 'unauthenticated' | 'failed' }

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

export async function addFavorite(m: FavoriteMovie): Promise<ActionResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: 'unauthenticated' }
  const input = validateFavoriteInput(m)
  if (!input) return { ok: false, error: 'failed' }
  try {
    const { error } = await session.supabase.from('favorites').upsert(
      {
        user_id: session.userId,
        movie_id: input.movieId,
        title: input.title,
        poster_path: input.posterPath,
        release_year: input.releaseYear,
      },
      { onConflict: 'user_id,movie_id', ignoreDuplicates: true },
    )
    if (error) return { ok: false, error: 'failed' }
    revalidatePath('/favoritos')
    return { ok: true }
  } catch {
    return { ok: false, error: 'failed' }
  }
}

export async function removeFavorite(movieId: number): Promise<ActionResult> {
  const session = await currentSession()
  if (!session) return { ok: false, error: 'unauthenticated' }
  if (!Number.isInteger(movieId) || movieId <= 0 || movieId > 2147483647) {
    return { ok: false, error: 'failed' }
  }
  try {
    const { error } = await session.supabase
      .from('favorites')
      .delete()
      .eq('user_id', session.userId)
      .eq('movie_id', movieId)
    if (error) return { ok: false, error: 'failed' }
    revalidatePath('/favoritos')
    return { ok: true }
  } catch {
    return { ok: false, error: 'failed' }
  }
}
