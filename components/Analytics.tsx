// components/Analytics.tsx
'use client';
import Script from 'next/script';

const Analytics = () => {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  // No renderizar nada si el ID de medición no está configurado
  if (!measurementId) {
    console.warn("Google Analytics is disabled: NEXT_PUBLIC_GA_MEASUREMENT_ID is not set.");
    return null;
  }

  return (
    <>
      {/* Carga el script principal de Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      {/* Inicializa Google Analytics */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  );
};

export default Analytics;
