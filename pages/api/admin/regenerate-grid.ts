// pages/api/admin/regenerate-grid.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { generateGridBuffer } from '../../../lib/generateGrid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 1. Proteger el endpoint con una clave secreta.
  if (req.query.secret !== process.env.ADMIN_SECRET_KEY) {
    return res.status(401).json({ message: 'Invalid secret key' });
  }

  // 2. Asegurarse de que el método sea GET.
  if (req.method === 'GET') {
    try {
      console.log('Grid regeneration triggered via API...');
      
      // 3. Generar el buffer de la imagen del grid.
      const gridBuffer = await generateGridBuffer(); 

      // 4. Subir el buffer a Vercel Blob, sobrescribiendo el archivo 'grid.png'.
      // CORRECCIÓN: Se usa 'allowOverwrite: true' para permitir la sobreescritura.
      await put('grid.png', gridBuffer, {
        access: 'public',
        allowOverwrite: true,
      });
      
      console.log('Grid regenerated and uploaded to Vercel Blob successfully.');
      return res.status(200).json({ success: true, message: 'Grid regenerated and uploaded to Vercel Blob.' });

    } catch (error) {
      console.error('Error during grid regeneration:', error);
      return res.status(500).json({ success: false, message: 'An error occurred during grid regeneration.' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
