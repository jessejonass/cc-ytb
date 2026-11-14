import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FavoriteButton } from '@/components/FavoriteButton'

const nav = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/filme/550',
  search: '',
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push, replace: nav.replace }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}))

const actions = vi.hoisted(() => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }))
vi.mock('@/app/actions/favorites', () => actions)

const m550 = { movieId: 550, title: 'Clube da Luta', posterPath: '/p.jpg', releaseYear: '1999' }

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nav.pathname = '/filme/550'
    nav.search = ''
  })

  it('deslogado vai para o login preservando a página e o favorito pendente', () => {
    render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn={false} />)
    fireEvent.click(screen.getByRole('button', { name: /Favoritar/ }))
    expect(nav.push).toHaveBeenCalledWith('/entrar?next=%2Ffilme%2F550%3Ffav%3D550')
    expect(actions.addFavorite).not.toHaveBeenCalled()
  })

  it('mantém outros parâmetros da URL no next', () => {
    nav.search = 'a=1'
    render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn={false} />)
    fireEvent.click(screen.getByRole('button'))
    expect(nav.push).toHaveBeenCalledWith(
      `/entrar?next=${encodeURIComponent('/filme/550?a=1&fav=550')}`,
    )
  })

  it('logado: atualiza na hora e chama a action', async () => {
    actions.addFavorite.mockResolvedValue({ ok: true })
    render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button')).toHaveTextContent('♥ Favoritado')
    await waitFor(() => expect(actions.addFavorite).toHaveBeenCalledWith(m550))
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('logado e favoritado: desfavorita chamando removeFavorite', async () => {
    actions.removeFavorite.mockResolvedValue({ ok: true })
    render(<FavoriteButton movie={m550} initialFavorited isLoggedIn />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
    await waitFor(() => expect(actions.removeFavorite).toHaveBeenCalledWith(550))
  })

  it('falha desfaz e mostra erro', async () => {
    actions.addFavorite.mockResolvedValue({ ok: false, error: 'failed' })
    render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn />)
    fireEvent.click(screen.getByRole('button'))
    expect(await screen.findByText('Não foi possível salvar. Tente de novo.')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('favorito pendente na URL chama addFavorite uma vez e limpa fav', async () => {
    actions.addFavorite.mockResolvedValue({ ok: true })
    nav.search = 'fav=550'
    render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn />)
    await waitFor(() => expect(actions.addFavorite).toHaveBeenCalledTimes(1))
    expect(nav.replace).toHaveBeenCalledWith('/filme/550')
    await waitFor(() =>
      expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true'),
    )
  })

  it('pendente de outro filme não dispara', () => {
    nav.search = 'fav=999'
    render(<FavoriteButton movie={m550} initialFavorited={false} isLoggedIn />)
    expect(actions.addFavorite).not.toHaveBeenCalled()
  })
})
