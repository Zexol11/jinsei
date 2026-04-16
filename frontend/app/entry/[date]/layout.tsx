import type { Metadata } from 'next';
import { format, parseISO, isValid } from 'date-fns';

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;

  let label = date;
  try {
    const parsed = parseISO(date);
    if (isValid(parsed)) {
      label = format(parsed, 'MMMM d, yyyy');
    }
  } catch {
    // fall back to raw date string
  }

  return {
    title: label,
    description: `Journal entry for ${label} on jinsei.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${label} · jinsei`,
      description: `Journal entry for ${label}.`,
    },
  };
}

export default function EntryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
