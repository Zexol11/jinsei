import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create a free jinsei account and start writing your daily journal today.',
  openGraph: {
    title: 'Create Account · jinsei',
    description: 'Create a free jinsei account and start journaling today.',
  },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
