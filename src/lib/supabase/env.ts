/**
 * Chave pública do Supabase. Projetos novos mostram a "publishable key"
 * (sb_publishable_...); projetos antigos, a "anon key". As duas funcionam igual.
 * Acesso literal a process.env.NEXT_PUBLIC_*: o Next só embute no navegador assim.
 */
export function supabaseKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    undefined
  )
}
