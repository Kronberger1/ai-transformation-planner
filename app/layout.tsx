import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Transformation Planner',
  description:
    'Map strategic AI transformation activities across your organisation.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.className} h-full`}>
      <body className="h-full bg-gray-50 font-sans antialiased">{children}</body>
    </html>
  )
}
