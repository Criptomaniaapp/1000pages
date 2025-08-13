import { NextApiRequest, NextApiResponse } from 'next';
// --- CORRECCIÓN CLAVE AQUÍ ---
import { generateGrid } from '../../../lib/generateGrid'; // Importar 'generateGrid'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Simple protección con una clave secreta en la URL
  if (req.query.secret !== process.env.REGENERATE_SECRET) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    console.log('Admin request received to regenerate grid...');
    // --- CORRECCIÓN CLAVE AQUÍ ---
    const blob = await generateGrid(); // Llamar a 'generateGrid'
    console.log('Admin regeneration successful.');
    res
      .status(200)
      .json({ message: 'Grid regenerated successfully', url: blob.url });
  } catch (error: any) {
    console.error('Admin grid regeneration failed:', error);
    res.status(500).json({ error: 'Failed to regenerate grid' });
  }
}