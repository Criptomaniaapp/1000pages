import { NextApiRequest, NextApiResponse } from 'next';
import { query } from '../../lib/db'; // Correcto: Importar { query }
import { GRID_WIDTH, GRID_HEIGHT } from '../../lib/constants';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { x, y, width, height } = req.body;

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof width !== 'number' ||
    typeof height !== 'number'
  ) {
    return res
      .status(400)
      .json({ available: false, error: 'Invalid input types' });
  }

  // Usar constantes para la validación
  if (
    x < 0 ||
    y < 0 ||
    width <= 0 ||
    height <= 0 ||
    x + width > GRID_WIDTH ||
    y + height > GRID_HEIGHT
  ) {
    return res
      .status(400)
      .json({ available: false, error: 'Coordinates out of bounds' });
  }

  try {
    const sql = `
      SELECT COUNT(*) as count FROM pixels
      WHERE x < ? AND x + width > ?
      AND y < ? AND y + height > ?
    `;
    const values = [x + width, x, y + height, y];
    
    // Correcto: Llamar a la función query() directamente
    const [rows] = await query(sql, values);

    // @ts-ignore
    const count = rows[0].count;

    res.status(200).json({ available: count === 0 });
  } catch (error) {
    console.error('DB query failed:', error);
    res.status(500).json({ available: false, error: 'Internal server error' });
  }
}