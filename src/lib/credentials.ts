// Pura (sem server-only): validação do formulário de login/cadastro.
export type AuthMode = 'entrar' | 'criar'

export const MIN_PASSWORD = 8

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function parseCredentials(
  formData: FormData,
  mode: AuthMode,
): { ok: true; email: string; password: string } | { ok: false; error: string } {
  const rawEmail = formData.get('email')
  const rawPassword = formData.get('password')
  const email = typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : ''
  const password = typeof rawPassword === 'string' ? rawPassword : ''
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Informe um e-mail válido.' }
  if (mode === 'criar' && password.length < MIN_PASSWORD) {
    return { ok: false, error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` }
  }
  if (!password) return { ok: false, error: 'Informe sua senha.' }
  return { ok: true, email, password }
}
