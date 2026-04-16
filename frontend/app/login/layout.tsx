import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your jinsei account and continue your daily journaling journey.',
  openGraph: {
    title: 'Sign In · jinsei',
    description: 'Sign in to your jinsei account.',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
