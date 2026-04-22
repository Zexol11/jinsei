import type { MetadataRoute } from 'next';

// Only the public-facing pages are listed here.
// Authenticated pages (/, /entry, /calendar, /insights, /settings, /trash)
// are omitted because this is a private journaling app.
export default function sitemap(): MetadataRoute.Sitemap {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jinsei.vercel.app';

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/register`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.7,
    },
  ];
}
