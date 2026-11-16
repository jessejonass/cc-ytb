import type { Metadata } from 'next'
import { WatchListPage } from '@/components/WatchListPage'

export const metadata: Metadata = { title: 'Já assistidos' }
export const dynamic = 'force-dynamic'

export default function AssistidosPage() {
  return <WatchListPage status="assistido" />
}
