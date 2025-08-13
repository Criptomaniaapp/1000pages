// pages/api/save-purchase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import multer from 'multer';
import pinataSDK from '@pinata/sdk';
import streamifier from 'streamifier';
import { put } from '@vercel/blob';
import { query } from '../../lib/db';
// CAMBIO: Importamos nuestra nueva y optimizada función de regeneración.
import { generateGridBuffer } from '../../lib/generateGrid';

const upload = multer({ storage: multer.memoryStorage() });
const pinata = new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_SECRET_API_KEY);
const GRID_BLOB_FILENAME = 'grid.png';

export const config = { api: { bodyParser: false } };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      await new Promise<void>((resolve, reject) => {
        upload.single('image')(req as any, res as any, (err: any) => {
          if (err) return reject(err);
          resolve();
        });
      });

      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: 'No image uploaded' });

      // 1. Subir la nueva imagen a Pinata
      const stream = streamifier.createReadStream(file.buffer);
      const pinataResult = await pinata.pinFileToIPFS(stream, { pinataMetadata: { name: `PixelImage-${Date.now()}` } });
      const imageUrl = `https://gateway.pinata.cloud/ipfs/${pinataResult.IpfsHash}`;

      // 2. Guardar la información de la compra en la base de datos
      const { area, wallet, link } = req.body as { area: string; wallet: string; link: string };
      const parsedArea = JSON.parse(area);
      await query(
        'INSERT INTO pixels (x_start, y_start, width, height, owner_wallet, image_url, link) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [parsedArea.x, parsedArea.y, parsedArea.w, parsedArea.h, wallet, imageUrl, link || null]
      );

      // 3. Regenerar el grid COMPLETO desde la base de datos de forma optimizada.
      console.log('Purchase saved. Triggering full grid regeneration...');
      const gridBuffer = await generateGridBuffer();

      // 4. Subir el nuevo grid a Vercel Blob.
      await put(GRID_BLOB_FILENAME, gridBuffer, {
        access: 'public',
        allowOverwrite: true,
      });
      console.log('New grid successfully generated and uploaded to Vercel Blob.');

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error('Error in save-purchase handler:', err);
      return res.status(500).json({ error: 'Error processing purchase' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
