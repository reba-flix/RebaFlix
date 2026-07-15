import type { Metadata, Viewport } from 'next'
import { Inter, Outfit, Archivo_Black } from 'next/font/google'
import { Navbar } from '@/components/layout/Navbar'
import { SupportChatWrapper } from '@/components/layout/SupportChatWrapper'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const archivoBlack = Archivo_Black({ subsets: ['latin'], weight: '400', variable: '--font-archivo-black' })

export const metadata: Metadata = {
  title: {
    default: 'RebaFlix',
    template: '%s | RebaFlix',
  },
  description:
    'RebaFlix is a premium streaming platform for original movies, TV series, live TV, documentaries, trailers, and exclusive content.',
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    title: 'RebaFlix',
    description: 'Original movies, live TV, documentaries, series, and exclusive premieres.',
    siteName: 'RebaFlix',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#141414',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} ${archivoBlack.variable} font-sans antialiased`}>
        <Navbar />
        {children}
        <SupportChatWrapper />
        <Toaster />
      </body>
    </html>
  )
}
