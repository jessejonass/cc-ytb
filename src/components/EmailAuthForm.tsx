'use client'

import { useActionState, useState } from 'react'
import { signInWithEmail, signUpWithEmail, type AuthFormState } from '@/app/actions/auth'
import { MIN_PASSWORD, type AuthMode } from '@/lib/credentials'

const initial: AuthFormState = { error: null }

const input =
  'w-full rounded-xl border border-white/15 bg-panel px-4 py-3 text-sm text-fg placeholder:text-muted focus:border-accent/60 focus:outline-none'

function ModeForm({ mode, next }: { mode: AuthMode; next: string }) {
  const [state, action, pending] = useActionState(
    mode === 'entrar' ? signInWithEmail : signUpWithEmail,
    initial,
  )
  const label = mode === 'entrar' ? 'Entrar' : 'Criar conta'
  return (
    <form action={action} className="flex flex-col gap-4 text-left">
      <input type="hidden" name="next" value={next} />
      <label className="flex flex-col gap-1.5 text-sm font-medium text-fg/80">
        E-mail
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <div className="flex flex-col gap-1.5">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-fg/80">
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
            minLength={mode === 'criar' ? MIN_PASSWORD : undefined}
            aria-describedby={mode === 'criar' ? 'senha-ajuda' : undefined}
            className={input}
          />
        </label>
        {mode === 'criar' && (
          <span id="senha-ajuda" className="text-xs text-muted">
            Mínimo de {MIN_PASSWORD} caracteres.
          </span>
        )}
      </div>
      {state.error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-400/30">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-full btn-light px-6 py-3 font-semibold transition-transform hover:scale-[1.03] active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
      >
        {label}
      </button>
    </form>
  )
}

export function EmailAuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<AuthMode>('entrar')
  const tab = (m: AuthMode, text: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === m}
      onClick={() => setMode(m)}
      className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-fg/70 transition-colors hover:text-fg aria-selected:bg-white/10 aria-selected:text-fg"
    >
      {text}
    </button>
  )
  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Entrar ou criar conta" className="flex gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
        {tab('entrar', 'Entrar')}
        {tab('criar', 'Criar conta')}
      </div>
      {/* key: trocar de modo zera o erro e o estado do formulário */}
      <ModeForm key={mode} mode={mode} next={next} />
    </div>
  )
}
