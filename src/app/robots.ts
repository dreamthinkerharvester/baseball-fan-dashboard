import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/'], // API endpoints는 검색 인덱싱 차단
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
