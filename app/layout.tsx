import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '수납바구니',
  description: 'Home 기반 물건 관리 서비스',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
