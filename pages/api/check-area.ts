// pages/api/check-area.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db';

// Interfaz para tipar cada bloque de píxeles (opcional, pero recomendado para consistencia)
interface PixelBlock {
  id: number;
  x_start: number;
  y_start: number;
  width: number;
  height: number;
  owner_wallet: string;
  image_url: string;
  link: string;
  tooltip: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { x, y, w, h } = req.body; // Directamente desestructura req.body (ya es objeto)

    // Validación básica para evitar errores
    if (typeof x !== 'number' || typeof y !== 'number' || typeof w !== 'number' || typeof h !== 'number' || w <= 0 || h <= 0) {
      return res.status(400).json({ error: 'Parámetros inválidos: x, y, w, h deben ser números positivos' });
    }

    // Lógica para chequear overlap con bloques existentes (ej: consulta SQL para ver si hay intersección)
    const overlapping = await query(
      'SELECT * FROM pixels WHERE NOT (x_start + width <= ? OR x_start >= ? + ? OR y_start + height <= ? OR y_start >= ? + ?)',
      [x, x, w, y, y, h]
    ) as PixelBlock[]; // Casteo opcional si usas la interfaz

    if (overlapping.length > 0) {
      return res.status(400).json({ error: 'Área ocupada' });
    }
    return res.status(200).json({ success: true });
  } else {
    res.status(405).end();
  }
}