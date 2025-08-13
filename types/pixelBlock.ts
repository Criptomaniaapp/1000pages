// types/pixelBlock.ts
export interface PixelBlock {
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