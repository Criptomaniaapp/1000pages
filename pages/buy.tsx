// pages/buy.tsx
'use client';
import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { createUsdcTransfer } from '../lib/solana';
import { Connection } from '@solana/web3.js';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function Buy() {
  const { publicKey, signTransaction } = useWallet();
  const [selectedArea, setSelectedArea] = useState({ x: 0, y: 0, w: 5, h: 5 }); // Ejemplo 5x5
  const [imageFile, setImageFile] = useState<File | null>(null);

  async function handleBuy() {
    if (!publicKey || !signTransaction) return;
    const pixels = selectedArea.w * selectedArea.h;
    if (pixels < 25) return alert('Mínimo 25 pixeles');

    // Verifica área libre en DB (fetch a API route)
    const res = await fetch('/api/check-area', { method: 'POST', body: JSON.stringify(selectedArea) });
    if (!res.ok) return alert('Área ocupada');

    // Crea tx
    const tx = await createUsdcTransfer(publicKey, pixels); // 1 USDC por pixel
    const signedTx = await signTransaction(tx);
    const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
    const signature = await connection.sendRawTransaction(signedTx.serialize());

    // Si confirma, sube imagen y guarda en DB (otra API route)
    const formData = new FormData();
    formData.append('image', imageFile!);
    formData.append('area', JSON.stringify(selectedArea));
    formData.append('wallet', publicKey.toString());
    await fetch('/api/save-purchase', { method: 'POST', body: formData });

    alert('Compra exitosa!');
  }

  return (
    <div>
      <Header />
      <main>
        <WalletMultiButton />
        {/* Canvas para seleccionar área (implementa con <canvas> y eventos) */}
        <canvas id="selector" width={1000} height={1000}></canvas>
        
        {/* Input corregido con label y title para accesibilidad */}
        <label htmlFor="image-upload" style={{ display: 'block', marginBottom: '10px' }}>
          Sube la imagen para tu grupo de pixeles (mínimo 5x5, formato PNG/JPG):
          <input
            id="image-upload"
            type="file"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            title="Selecciona una imagen para representar tu memecoin en la cuadrícula"
            accept="image/png, image/jpeg"
          />
        </label>
        
        <button onClick={handleBuy}>Comprar</button>
      </main>
      <Footer />
    </div>
  );
}