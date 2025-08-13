// Import the 'query' function directly
import { query } from './db';
import { generateGrid } from './generateGrid';

interface PurchaseData {
  x: number;
  y: number;
  width: number;
  height: number;
  link: string;
  image_url: string;
  owner: string;
  signature: string;
}

export async function savePurchaseToDB({
  x,
  y,
  width,
  height,
  link,
  image_url,
  owner,
  signature,
}: PurchaseData): Promise<void> {
  console.log('Saving purchase to DB:', { signature, owner });

  // 1. Prepare the SQL query and values
  const sql = `
    INSERT INTO pixels (x, y, width, height, link, image_url, owner, signature)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [x, y, width, height, link, image_url, owner, signature];

  try {
    // 2. Call the imported 'query' function directly
    await query(sql, values);
    console.log('DB insert successful for signature:', signature);
  } catch (error) {
    console.error('DB insert failed:', error);
    // If the insertion fails, we should stop here.
    throw new Error('Failed to save purchase to the database.');
  }

  // 3. Regenerate the grid after a successful save
  try {
    await generateGrid();
    console.log('Grid regeneration triggered successfully for signature:', signature);
  } catch (error) {
    console.error('Grid regeneration failed:', error);
    // Even if regeneration fails, the purchase is saved, which is critical.
    // We can still throw an error to signal that the full process didn't complete.
    throw new Error('Purchase saved, but grid regeneration failed.');
  }
}