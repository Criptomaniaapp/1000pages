// pages/terms.tsx
import Head from 'next/head'; // Import Head for SEO meta tags
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsOfUse() {
  const pageTitle = "Terms of Use - The Million Memecoin Homepage";
  const pageDescription = "Read the official Terms of Use for The Million Memecoin Homepage. Understand the rules for purchasing pixel advertising space on our Solana-based digital canvas.";
  const siteUrl = "https://onemillionmemecoinpage.com/terms";

  // JSON-LD Structured Data for better SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": pageTitle,
    "description": pageDescription,
    "url": siteUrl,
    "mainEntity": {
      "@type": "LegalNotice",
      "name": "Terms of Use"
    }
  };

  return (
    <div>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <Header />
      <main className="legal-page-container">
        <article className="legal-content">
          <h1>Terms of Use</h1>
          <p><strong>Last Updated:</strong> August 4, 2025</p>

          <section>
            <p>
              Welcome to The Million Memecoin Homepage! These Terms of Use ("Terms") govern your access to and use of our website located at onemillionmemecoinpage.com (the "Site") and our services, which allow users to purchase pixel advertising space on a digital canvas powered by the Solana blockchain (the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2>1. The Service: Pixel Advertising on a Digital Canvas</h2>
            <p>
              The Service allows you to purchase blocks of pixels on our homepage. For each purchased block, you may upload an image and provide a hyperlink to an external website. The cost per pixel is denominated in USDC. All transactions are processed on the Solana blockchain and are irreversible, creating a permanent piece of internet history.
            </p>
          </section>

          <section>
            <h2>2. User Content and Responsibilities</h2>
            <p>
              You are solely responsible for the content (images and links) you upload. This content represents your brand or memecoin on our digital canvas. You agree not to upload, post, or link to any content that is:
            </p>
            <ul>
              <li>Illegal, fraudulent, or malicious.</li>
              <li>Infringing on any third party's intellectual property rights, including copyright, trademark, or patent.</li>
              <li>Defamatory, obscene, pornographic, vulgar, or offensive.</li>
              <li>Promoting discrimination, bigotry, racism, hatred, harassment, or harm against any individual or group.</li>
            </ul>
            <p>
              We reserve the right, at our sole discretion, to remove any content that violates these Terms without notice or refund to maintain the integrity of our advertising space.
            </p>
          </section>

          <section>
            <h2>3. Purchases, Payments, and Solana Transactions</h2>
            <p>
              All purchases of pixel space are final and non-refundable. Transactions are conducted via the Solana network, and we are not responsible for any transaction failures, lost funds, or other issues arising from your use of the Solana network or your personal wallet. You are responsible for all transaction fees (gas fees) required by the network.
            </p>
          </section>

          <section>
            <h2>4. Referral Program</h2>
            <p>
              Our referral program allows you to earn a commission on purchases made by users who access the Site through your unique referral link. The commission is currently set at 20% of the purchase amount and is paid out in USDC directly to your wallet as part of the purchase transaction on the Solana blockchain. We reserve the right to modify or terminate the referral program at any time.
            </p>
          </section>
          
          <section>
            <h2>5. Link Changes and Administration</h2>
            <p>
                If you wish to change the web address (URL) associated with your purchased pixels, an administrative fee of $5 USDC is required. Please send your request via email, including the original purchasing wallet address for verification.
            </p>
          </section>

          <section>
            <h2>6. Disclaimers and Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without any warranties of any kind. We do not guarantee that the Site will be available at all times or that the content linked by users is safe or accurate. We are not responsible for the content of any external websites linked from our homepage. In no event shall we be liable for any damages arising out of your use of the Service.
            </p>
          </section>

          <section>
            <h2>7. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such change constitutes your acceptance of the new Terms.
            </p>
          </section>
          
          <section>
            <h2>8. Contact Information</h2>
            <address>
                For any questions about these Terms, please contact us at:
                <a href="mailto:support@onemillionmemecoinpage.com">support@onemillionmemecoinpage.com</a>
            </address>
          </section>

        </article>
      </main>
      <Footer />
    </div>
  );
}
