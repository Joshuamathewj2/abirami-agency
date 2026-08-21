import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://abiramiagency.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/auth/', '/user/', '/cart/', '/invoice/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
