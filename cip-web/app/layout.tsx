import type { Metadata, Viewport } from 'next';
import { Inter, Syne, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: { default: 'CIP — AI Career Intelligence Platform', template: '%s | CIP' },
  description: 'Real-time interview coaching, skill intelligence, and job matching powered by AI. Prepare smarter, get hired faster.',
  keywords: ['AI interview coach', 'career intelligence', 'job matching', 'skill analysis', 'interview prep', 'career', 'placement'],
  authors: [{ name: 'CIP Team' }],
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'CIP — AI Career Intelligence Platform',
    description: 'Prepare. Improve. Get Hired — with AI.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${syne.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
