import type { MetadataRoute } from 'next';

// jinsei is a private app — search engines should not index any pages.
export default function robots(): MetadataRoute.Robots {
  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://jinsei.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/calendar', '/entry', '/insights', '/settings', '/trash'],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
