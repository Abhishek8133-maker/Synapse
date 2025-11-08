import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Synapse - Your Visual Memory',
  description: 'Personal knowledge management system that captures, understands, and visually organizes your thoughts',
  keywords: 'knowledge management, notes, semantic search, AI, memory',
  authors: [{ name: 'Synapse Team' }],
  openGraph: {
    title: 'Synapse - Your Visual Memory',
    description: 'Transform fragmented inputs into a coherent, searchable memory',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}