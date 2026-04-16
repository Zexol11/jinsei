import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Insights',
  description:
    'View mood trends, streaks, and reflective insights from your jinsei journal.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Insights · jinsei',
    description: 'Mood trends, streaks, and reflective insights from your journal.',
  },
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
