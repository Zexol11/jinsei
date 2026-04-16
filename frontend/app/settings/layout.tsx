import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings',
  description:
    'Manage your jinsei account preferences, theme, and security settings.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Settings · jinsei',
    description: 'Manage your account preferences and security settings.',
  },
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
