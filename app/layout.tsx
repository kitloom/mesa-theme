import type { Metadata } from 'next'
import { DM_Serif_Display, Work_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { NoticeProvider } from '@/components/Notice'
import { getPage } from '@/lib/page'
import './globals.css'

const display = DM_Serif_Display({ weight: '400', subsets: ['latin', 'latin-ext'], variable: '--font-display' })
const body = Work_Sans({ subsets: ['latin', 'latin-ext'], variable: '--font-body' })

export const metadata: Metadata = { icons: { icon: '/favicon.svg' } }

// The visitor's choice of light or dark, on <html> before the first paint.
const THEME = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The first page's language for <html>; HtmlLang keeps it in step on the pages after.
  const path = (await headers()).get('x-theme-path') ?? '/'
  const page = await getPage(path)

  return (
    <html lang={page?.site?.language?.slice(0, 2) ?? 'en'} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
      </head>
      <body>
        <NoticeProvider>{children}</NoticeProvider>
      </body>
    </html>
  )
}
