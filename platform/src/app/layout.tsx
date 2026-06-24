import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Link from "next/link"

import Header from './Header'
import AuthGuard from '@/components/AuthGuard'
import ConsentChecker from '@/components/ConsentChecker'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "FarFindARole Learn | AI-Powered E-Learning Platform",
  description: "Learn cutting-edge skills, complete interactive quizzes, prove your mastery with verifiable certificates, and find your dream role.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-red-500/10 selection:text-red-600">
        
        {/* Client Header component */}
        <Header />

        {/* Page Content wrapped in Auth Router Guard */}
        <main className="flex-1 flex flex-col bg-slate-50">
          <AuthGuard>
            {children}
            <ConsentChecker />
          </AuthGuard>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50 py-8 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} FarFindARole Learn. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
              <Link href="/pricing-terms" className="hover:text-gray-900 transition-colors">Pricing</Link>
              <a href="https://github.com/farfindarole" target="_blank" rel="noopener noreferrer" className="hover:text-gray-950 transition-colors">Github</a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  )
}
