import type { Metadata } from 'next'
import { WatchListPage } from '@/components/WatchListPage'

export const metadata: Metadata = { title: 'Quero assistir' }
export const dynamic = 'force-dynamic'

export default function QueroAssistirPage() {
  return <WatchListPage status="quero" />
}
