import sharp from 'sharp';
import { put } from '@vercel/blob';
import { GRID_WIDTH, GRID_HEIGHT, PIXEL_SIZE } from './constants';
// Cambia esta línea de importación
import { query } from './db'; // Correcto: Importación nombrada

export async function generateGrid() {
  console.log('Regenerating grid...');

  // 1. Crear lienzo base
  const canvas = sharp({
    create: {
      width: GRID_WIDTH * PIXEL_SIZE,
      height: GRID_HEIGHT * PIXEL_SIZE,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  });

  // 2. Obtener todos los píxeles comprados
  // Y cambia esta línea
  const [pixels] = await query('SELECT * FROM pixels'); // Correcto: Llama a la función directamente

  if (Array.isArray(pixels) && pixels.length > 0) {
    // 3. Obtener las imágenes y componerlas
    const imageBuffers = await Promise.all(
      pixels.map(async (p: any) => {
        try {
          const response = await fetch(p.image_url);
          if (!response.ok) return null;
          const buffer = await response.arrayBuffer();
          // Redimensionar la imagen para que encaje exactamente en el área comprada
          const resizedBuffer = await sharp(buffer)
            .resize(p.width * PIXEL_SIZE, p.height * PIXEL_SIZE)
            .toBuffer();

          return {
            input: resizedBuffer,
            left: p.x * PIXEL_SIZE,
            top: p.y * PIXEL_SIZE,
          };
        } catch (error) {
          console.error(`Failed to fetch or process image ${p.image_url}:`, error);
          return null;
        }
      })
    );

    // Filtrar las imágenes que fallaron y componer
    const validImages = imageBuffers.filter(img => img !== null) as { input: Buffer; left: number; top: number; }[];
    if (validImages.length > 0) {
      canvas.composite(validImages);
    }
  }

  // 4. Guardar la imagen final
  const outputBuffer = await canvas.png().toBuffer();

  const blob = await put('grid.png', outputBuffer, {
    access: 'public',
    contentType: 'image/png',
  });

  console.log('Grid regenerated and uploaded:', blob.url);
  return blob;
}