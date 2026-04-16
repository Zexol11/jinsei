import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Calendar',
  description:
    'Browse your journal entries by month on the jinsei calendar view.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Calendar · jinsei',
    description: 'Browse your journal entries by month.',
  },
};

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
