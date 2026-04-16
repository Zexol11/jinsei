import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trash',
  description:
    'View and manage your deleted jinsei journal entries.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Trash · jinsei',
    description: 'View and restore your deleted journal entries.',
  },
};

export default function TrashLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
