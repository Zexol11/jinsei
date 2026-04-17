import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jinsei.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'jinsei — your life journal',
    template: '%s · jinsei',
  },
  description:
    'jinsei is a calm, minimal personal journaling app. Write one entry per day, track your mood, and reflect on your inner world.',
  keywords: [
    'journal', 'journaling', 'diary', 'daily journal', 'mood tracker',
    'personal journal', 'reflection', 'mindfulness', 'writing', 'jinsei',
  ],
  authors: [{ name: 'jinsei' }],
  creator: 'jinsei',
  publisher: 'jinsei',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'jinsei',
    title: 'jinsei — your life journal',
    description:
      'A calm, minimal personal journaling app. Write one entry per day, track your mood, and reflect on your inner world.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'jinsei — your life journal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'jinsei — your life journal',
    description:
      'A calm, minimal personal journaling app. Write one entry per day.',
    images: [
      {
        url: '/og-image.png',
        alt: 'jinsei — your life journal cover image',
      },
    ],
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f3ee' },
    { media: '(prefers-color-scheme: dark)',  color: '#0d0f0d' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased font-inter bg-[var(--surface)] text-[var(--on-surface)] transition-colors duration-200">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
