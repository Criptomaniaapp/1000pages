// pages/_app.tsx
import type { AppProps } from 'next/app';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets';
import { useMemo } from 'react'; // Importar useMemo para optimización
import { connection } from '../lib/solana';
import Analytics from '../components/Analytics'; // Importar el componente de Analytics
import '../styles/globals.css';
import '@solana/wallet-adapter-react-ui/styles.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  // Se recomienda usar useMemo para evitar que el array de wallets se recree en cada renderizado
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    []
  );

  return (
    <>
      {/* Añade el componente de Analytics aquí para que se cargue en todas las páginas */}
      <Analytics />
      
      <ConnectionProvider endpoint={connection.rpcEndpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Component {...pageProps} />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </>
  );
}
