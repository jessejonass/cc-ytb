import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/filme/550',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  usePathname: () => nav.pathname,
}))

const actions = vi.hoisted(() => ({ setWatchStatus: vi.fn(), clearWatchStatus: vi.fn() }))
vi.mock('@/app/actions/watch-status', () => actions)

import { WatchStatusButtons } from '@/components/WatchStatusButtons'

function setUrl(url: string) {
  window.history.replaceState(null, '', url)
}

const m550 = { movieId: 550, title: 'Clube da Luta', posterPath: '/p.jpg', releaseYear: '1999' }
const quero = () => screen.getByRole('button', { name: /Quero assistir/ })
const assisti = () => screen.getByRole('button', { name: /Já assisti/ })

describe('WatchStatusButtons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nav.pathname = '/filme/550'
    setUrl('/filme/550')
  })

  it('mostra o estado inicial', () => {
    render(<WatchStatusButtons movie={m550} initialStatus="assistido" isLoggedIn />)
    expect(quero()).toHaveAttribute('aria-pressed', 'false')
    expect(assisti()).toHaveAttribute('aria-pressed', 'true')
  })

  it('deslogado vai para o login com o estado pendente', () => {
    render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn={false} />)
    fireEvent.click(assisti())
    expect(nav.push).toHaveBeenCalledWith(`/entrar?next=${encodeURIComponent('/filme/550?lista=assistido')}`)
    expect(actions.setWatchStatus).not.toHaveBeenCalled()
  })

  it('trocar de quero para assistido', async () => {
    actions.setWatchStatus.mockResolvedValue({ ok: true })
    render(<WatchStatusButtons movie={m550} initialStatus="quero" isLoggedIn />)
    fireEvent.click(assisti())
    expect(assisti()).toHaveAttribute('aria-pressed', 'true')
    expect(quero()).toHaveAttribute('aria-pressed', 'false')
    await waitFor(() => expect(actions.setWatchStatus).toHaveBeenCalledWith(m550, 'assistido'))
  })

  it('clicar no ativo limpa', async () => {
    actions.clearWatchStatus.mockResolvedValue({ ok: true })
    render(<WatchStatusButtons movie={m550} initialStatus="quero" isLoggedIn />)
    fireEvent.click(quero())
    await waitFor(() => expect(actions.clearWatchStatus).toHaveBeenCalledWith(550))
    expect(quero()).toHaveAttribute('aria-pressed', 'false')
    expect(assisti()).toHaveAttribute('aria-pressed', 'false')
  })

  it('falha volta ao estado anterior', async () => {
    actions.setWatchStatus.mockResolvedValue({ ok: false, error: 'failed' })
    render(<WatchStatusButtons movie={m550} initialStatus="quero" isLoggedIn />)
    fireEvent.click(assisti())
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível salvar. Tente de novo.')
    expect(quero()).toHaveAttribute('aria-pressed', 'true')
    expect(assisti()).toHaveAttribute('aria-pressed', 'false')
  })

  it('exceção também volta ao estado anterior', async () => {
    actions.clearWatchStatus.mockRejectedValue(new Error('rede'))
    render(<WatchStatusButtons movie={m550} initialStatus="assistido" isLoggedIn />)
    fireEvent.click(assisti())
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(assisti()).toHaveAttribute('aria-pressed', 'true')
  })

  it('aplica ?lista= pendente uma vez e limpa a URL', async () => {
    setUrl('/filme/550?lista=quero')
    actions.setWatchStatus.mockResolvedValue({ ok: true })
    render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn />)
    await waitFor(() => expect(actions.setWatchStatus).toHaveBeenCalledWith(m550, 'quero'))
    expect(actions.setWatchStatus).toHaveBeenCalledTimes(1)
    expect(nav.replace).toHaveBeenCalledWith('/filme/550')
    expect(quero()).toHaveAttribute('aria-pressed', 'true')
  })

  it('mantém outros parâmetros ao limpar ?lista=', async () => {
    setUrl('/filme/550?a=1&lista=assistido')
    actions.setWatchStatus.mockResolvedValue({ ok: true })
    render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn />)
    await waitFor(() => expect(nav.replace).toHaveBeenCalledWith('/filme/550?a=1'))
  })

  it('ignora ?lista= inválido', () => {
    setUrl('/filme/550?lista=xyz')
    render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn />)
    expect(actions.setWatchStatus).not.toHaveBeenCalled()
  })

  it('ignora ?lista= quando deslogado', () => {
    setUrl('/filme/550?lista=quero')
    render(<WatchStatusButtons movie={m550} initialStatus={null} isLoggedIn={false} />)
    expect(actions.setWatchStatus).not.toHaveBeenCalled()
  })
})
