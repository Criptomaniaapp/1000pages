import { NextApiRequest, NextApiResponse } from 'next';
import { put } from '@vercel/blob';
import { nanoid } from 'nanoid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data not provided.' });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const fileName = `pre-purchase-${nanoid()}.png`;

    const blob = await put(fileName, imageBuffer, {
      access: 'public',
      contentType: 'image/png',
    });

    res.status(200).json({ imageUrl: blob.url });

  } catch (error: any) {
    console.error('Image upload failed:', error);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
}