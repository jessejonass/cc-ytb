// Puro: usado pelo HomeTabs (servidor) e pelo NavLinks (cliente).
export const HOME_TABS = [
  { key: 'inicio', href: '/', label: 'Início' },
  { key: 'quero', href: '/quero-assistir', label: 'Quero assistir' },
  { key: 'assistido', href: '/assistidos', label: 'Já assistidos' },
] as const

export type HomeTabKey = (typeof HOME_TABS)[number]['key']

export function isHomeTabPath(pathname: string | null): boolean {
  return HOME_TABS.some((t) => t.href === pathname)
}
