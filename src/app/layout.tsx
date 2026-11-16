import type { Metadata } from 'next'
import { Big_Shoulders, Instrument_Sans } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getCurrentUser } from '@/lib/supabase/server'
import './globals.css'

const shoulders = Big_Shoulders({
  variable: '--font-shoulders',
  subsets: ['latin'],
  axes: ['opsz'],
})
const instrument = Instrument_Sans({
  variable: '--font-instrument',
  subsets: ['latin'],
  axes: ['wdth'],
})

export const metadata: Metadata = {
  title: 'CINE — Catálogo de filmes',
  description: 'Descubra filmes e onde assistir no Brasil.',
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser()
  return (
    <html lang="pt-BR">
      <body
        className={`${shoulders.variable} ${instrument.variable} bg-bg font-sans text-fg antialiased`}
      >
        <Header user={user} />
        <main className="min-h-[70vh] overflow-x-clip pt-(--header-h)">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
