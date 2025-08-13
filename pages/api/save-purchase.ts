import { NextApiRequest, NextApiResponse } from 'next';
import { verifySignature } from '../../lib/solana'; // Esta importación ahora es válida
import { savePurchaseToDB } from '../../lib/savePurchase';
import { put } from '@vercel/blob';
import { PublicKey } from '@solana/web3.js';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const {
      x,
      y,
      width,
      height,
      link,
      imageBase64,
      owner,
      signature,
      referrer,
    } = req.body;

    const price = width * height; // Calcular el precio
    const buyerPublicKey = new PublicKey(owner);
    const referrerPublicKey = referrer ? new PublicKey(referrer) : undefined;

    // 1. Verificar firma de la transacción de Solana
    const isVerified = await verifySignature(
      signature,
      buyerPublicKey,
      price,
      referrerPublicKey
    );

    if (!isVerified) {
      return res.status(400).json({ error: 'Invalid or fraudulent signature' });
    }

    // 2. Subir imagen a Vercel Blob
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const blob = await put(`purchase-${signature}.png`, imageBuffer, {
      access: 'public',
      contentType: 'image/png',
    });

    // 3. Llamar a la función de guardado unificada
    await savePurchaseToDB({
      x,
      y,
      width,
      height,
      link,
      image_url: blob.url,
      owner,
      signature,
    });

    res
      .status(200)
      .json({ success: true, message: 'Purchase saved and grid updated.' });
  } catch (error: any) {
    console.error('Save purchase failed:', error);
    res
      .status(500)
      .json({ error: 'Internal Server Error', details: error.message });
  }
}