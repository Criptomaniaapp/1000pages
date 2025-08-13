// pages/index.tsx
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../components/Header';
import Footer from '../components/Footer';
import GridInteractor from '../components/GridInteractor';
import { PixelBlock } from '../types/pixelBlock';
import { query } from '../lib/db';
import { list } from '@vercel/blob';

// --- Componente Principal con la Lógica del Cliente ---
function HomeComponent({ initialBlocks, gridImageUrl, referrerAddress }: { initialBlocks: PixelBlock[], gridImageUrl: string, referrerAddress: string | null }) {

  // --- NUEVO Contenido SEO ---
  const pageTitle = "The Thousand Block Homepage - Your Ad on a Digital Canvas";
  const pageDescription = "Buy a piece of digital history on The Thousand Block Homepage. Purchase ad space on our 1,000 block grid, with payments in Solana or Stripe. Feature your project forever.";
  const siteUrl = "https://tu-dominio.com"; // <-- REEMPLAZA CON TU DOMINIO REAL
  const socialImageUrl = `${siteUrl}/memecoin.png`; 

  // --- NUEVOS Datos Estructurados JSON-LD ---
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "The Thousand Block Homepage", // <-- CAMBIADO
    "url": siteUrl,
    "description": pageDescription, // <-- CAMBIADO
    "potentialAction": {
      "@type": "ViewAction",
      "target": siteUrl
    }
  };

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
            // Las props están bien, no hay que cambiarlas.
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

// --- Componente de Página y Lógica del Servidor ---
export default function Page({ initialBlocks, gridImageUrl }: { initialBlocks: PixelBlock[], gridImageUrl: string }) {
  const router = useRouter();
  const [referrerAddress, setReferrerAddress] = useState<string | null>(null);

  useEffect(() => {
    if (router.isReady) {
      const ref = router.query.ref;
      if (ref && typeof ref === 'string') {
        console.log('Referrer found in URL:', ref);
        setReferrerAddress(ref);
      }
    }
  }, [router.isReady, router.query]);

  return <HomeComponent initialBlocks={initialBlocks} gridImageUrl={gridImageUrl} referrerAddress={referrerAddress} />;
}

export async function getServerSideProps() {
  const blocks = await query('SELECT * FROM pixels');
  const serializedBlocks = blocks.map((block: any) => ({
    ...block,
    // Asegurarse de que el objeto Date es serializable
    sold_at: block.sold_at ? block.sold_at.toISOString() : null,
  }));

  let gridImageUrl = '/placeholder-grid.png'; // Fallback
  try {
    const { blobs } = await list({ prefix: 'grid.png', limit: 1 });
    if (blobs.length > 0) {
        const baseUrl = blobs[0].url;
        // Añadir un timestamp previene problemas de caché. La imagen se recargará cuando cambie.
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