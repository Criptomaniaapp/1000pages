// lib/generateGrid.ts
import sharp from 'sharp';
import { query } from './db';

/**
 * Procesa un lote de bloques de píxeles en paralelo.
 * @param batch Un array de objetos de bloque de la base de datos.
 * @returns Una promesa que se resuelve con un array de objetos listos para la composición de Sharp.
 */
async function processBatch(batch: any[]) {
  const imagePromises = batch.map(async (block) => {
    try {
      const response = await fetch(block.image_url);
      if (!response.ok) {
        console.error(`Failed to download image for block ${block.id}: ${response.statusText}`);
        return null;
      }
      const imgBuffer = Buffer.from(await response.arrayBuffer());
      const resized = await sharp(imgBuffer).resize(block.width, block.height).toBuffer();
      return {
        input: resized,
        left: block.x_start,
        top: block.y_start,
      };
    } catch (error) {
      console.error(`Error processing image for block ${block.id}:`, error);
      return null; // Si una imagen falla, no detenemos todo el proceso.
    }
  });

  // Espera a que todas las promesas del lote se completen.
  const processedImages = await Promise.all(imagePromises);
  // Filtra cualquier resultado nulo de imágenes que fallaron.
  return processedImages.filter(image => image !== null);
}


/**
 * Genera la imagen completa del grid a partir de todos los píxeles en la base de datos.
 * Utiliza un sistema de lotes para procesar imágenes en paralelo de forma eficiente.
 * @returns Un Buffer con la imagen PNG del grid generado.
 */
export async function generateGridBuffer(): Promise<Buffer> {
  const gridSize = 1000;
  const blocks = await query('SELECT * FROM pixels WHERE image_url IS NOT NULL');
  
  const allComposites: any[] = [];
  const batchSize = 10; // Procesar 10 imágenes a la vez. ¡Mucho más rápido!

  console.log(`Starting grid generation for ${blocks.length} images in batches of ${batchSize}.`);

  for (let i = 0; i < blocks.length; i += batchSize) {
    const batch = blocks.slice(i, i + batchSize);
    console.log(`Processing batch #${(i / batchSize) + 1}...`);
    const processedBatch = await processBatch(batch);
    allComposites.push(...processedBatch);
  }
  
  const gridBuffer = await sharp({
    create: {
      width: gridSize,
      height: gridSize,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
  .composite(allComposites)
  .png()
  .toBuffer();

  console.log('Grid buffer generated successfully from database.');
  return gridBuffer;
}
