// pages/index.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'; // Importar Head para el SEO
import Header from '../components/Header';
import Footer from '../components/Footer';
import GridInteractor from '../components/GridInteractor';
import { PixelBlock } from '../types/pixelBlock';

function HomeComponent({ initialBlocks, gridImageUrl }: { initialBlocks: PixelBlock[], gridImageUrl: string }) {
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);
  const router = useRouter();

  // --- SEO Content ---
  const pageTitle = "The Million Memecoin Homepage - Your Ad on Internet History";
  const pageDescription = "Buy a piece of internet history on The Million Memecoin Homepage. Purchase pixel ad space on our 1,000,000 pixel grid, powered by Solana. Feature your memecoin or project forever.";
  const siteUrl = "https://onemillionmemecoinpage.com";
  // Reemplaza esta URL con una imagen atractiva de tu sitio para compartir en redes sociales (1200x630px recomendado)
  const socialImageUrl = `${siteUrl}/memecoin.png`; 

  // Datos Estructurados JSON-LD para un mejor SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Million Memecoin Homepage",
    "url": siteUrl,
    "description": pageDescription,
    "potentialAction": {
      "@type": "ViewAction",
      "target": siteUrl
    }
  };

  useEffect(() => {
    if (router.isReady) {
      const ref = router.query.ref;
      if (ref && typeof ref === 'string') {
        console.log('Referrer found in URL:', ref);
        setReferrerAddress(ref);
      }
    }
  }, [router.isReady, router.query]);

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={siteUrl} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={socialImageUrl} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={siteUrl} />
        <meta property="twitter:title" content={pageTitle} />
        <meta property="twitter:description" content={pageDescription} />
        <meta property="twitter:image" content={socialImageUrl} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <Header />
      <main>
        <div className="grid-scroll-container">
          <GridInteractor 
            initialBlocks={initialBlocks} 
            referrerAddress={referrerAddress} 
            gridImageUrl={gridImageUrl}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { query } from '../lib/db';
import { list } from '@vercel/blob';

export default function Page({ initialBlocks, gridImageUrl }: { initialBlocks: PixelBlock[], gridImageUrl: string }) {
    return <HomeComponent initialBlocks={initialBlocks} gridImageUrl={gridImageUrl} />;
}

export async function getServerSideProps() {
  const blocks = await query('SELECT * FROM pixels');
  const serializedBlocks = blocks.map((block: any) => ({
    ...block,
    sold_at: block.sold_at ? block.sold_at.toISOString() : null,
  }));

  let gridImageUrl = '/placeholder-grid.png';
  try {
    const { blobs } = await list({ prefix: 'grid.png', limit: 1 });
    if (blobs.length > 0) {
        const baseUrl = blobs[0].url;
        gridImageUrl = `${baseUrl}?v=${new Date().getTime()}`;
    } else {
        console.log("grid.png not found in Vercel Blob, using fallback.");
    }
  } catch (error) {
    console.error("Error fetching grid from Vercel Blob:", error);
  }

  return {
    props: { 
      initialBlocks: serializedBlocks,
      gridImageUrl: gridImageUrl,
    },
  };
}
