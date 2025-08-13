// pages/api/sitemap.xml.ts
import { NextApiRequest, NextApiResponse } from 'next';

const generateSitemap = (baseUrl: string) => {
  // Aquí defines las páginas estáticas de tu sitio.
  const staticPages = [
    { url: '/', changefreq: 'daily', priority: '1.0' },
    { url: '/terms', changefreq: 'monthly', priority: '0.8' },
    // Si en el futuro añades más páginas, simplemente agrégalas aquí.
    // { url: '/about', changefreq: 'monthly', priority: '0.7' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${staticPages
        .map((page) => {
          return `
            <url>
              <loc>${`${baseUrl}${page.url}`}</loc>
              <lastmod>${new Date().toISOString()}</lastmod>
              <changefreq>${page.changefreq}</changefreq>
              <priority>${page.priority}</priority>
            </url>
          `;
        })
        .join('')}
    </urlset>
  `;

  return sitemap;
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Determina la URL base de tu sitio.
  // Es importante usar la variable de entorno de Vercel en producción.
  const baseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';
  
  const sitemap = generateSitemap(baseUrl);

  res.setHeader('Content-Type', 'text/xml');
  res.write(sitemap);
  res.end();
}
