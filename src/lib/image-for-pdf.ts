import sharp from 'sharp';
import type { SiteImageData } from './site-image';

/** Flatten transparent PNGs to JPEG so logos render in all PDF viewers. */
export async function prepareImageForPdf(image: SiteImageData): Promise<SiteImageData> {
  try {
    const flattened = await sharp(Buffer.from(image.bytes))
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();

    return {
      bytes: new Uint8Array(flattened),
      format: 'jpg',
    };
  } catch (error) {
    console.error('Failed to prepare image for PDF embedding:', error);
    return image;
  }
}
