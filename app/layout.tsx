import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { getLocale } from 'next-intl/server'
import { ThemeProvider } from 'next-themes'
import { SessionProvider } from '@/components/auth/SessionProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'AgentLab — Build Your AI Agents',
    template: '%s | AgentLab',
  },
  description: 'Create and chat with custom AI agents powered by your own Anthropic API key.',
  keywords: ['AI agents', 'Anthropic', 'Claude', 'BYOK', 'chatbot builder'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'AgentLab',
    title: 'AgentLab — Build Your AI Agents',
    description: 'Create and chat with custom AI agents powered by your own Anthropic API key.',
  },
}

/**
 * Root layout that wraps the entire application.
 * Provides theme, i18n, and session context to all pages.
 */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider messages={messages} locale={locale}>
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
