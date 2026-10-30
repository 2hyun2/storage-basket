import type { Metadata } from 'next'
import { QueryProvider } from '@/components/query-provider'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://storage-basket.vercel.app'),
  title: '우리집 공간록',
  description: '내 공간을 직접 만들고, 물건의 자리를 기억하세요. 3D로 꾸미며 함께 정리하는 우리집 공간록.',
  applicationName: '우리집 공간록',
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    siteName: '우리집 공간록',
    title: '우리집 공간록',
    description: '3D로 꾸미며 정리하고, 물건의 자리를 기억하세요.',
  },
  twitter: {
    card: 'summary_large_image',
    title: '우리집 공간록',
    description: '3D로 꾸미며 정리하고, 물건의 자리를 기억하세요.',
    images: ['/opengraph-image.png'],
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
