import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { PostHogProvider } from '@/lib/posthog'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Whispie - Practice Difficult Workplace Conversations',
  description: 'Flight simulator for difficult workplace conversations. Practice with AI personas and get feedback on your communication skills.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} font-display antialiased`}>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  )
}
