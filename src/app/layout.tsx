import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import './globals.css'

const archivo = Archivo({ variable: '--font-archivo', subsets: ['latin'] })
const inter = Inter({ variable: '--font-inter', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CINE — Catálogo de filmes',
  description: 'Descubra filmes e onde assistir no Brasil.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${archivo.variable} ${inter.variable} bg-bg font-sans text-fg antialiased`}>
        <Header user={null} />
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
