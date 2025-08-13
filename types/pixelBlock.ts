// types/pixelBlock.ts
export interface PixelBlock {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  link: string;
  image_url: string;
  owner: string;
  signature: string;
  sold_at: string; // O Date, pero string es más seguro para la serialización
}