// Profile photo: the first image found in ./img at the project root.
// Drop a .jpg/.png/.webp there and it is picked up and optimized at build.
import type { ImageMetadata } from 'astro';

const found = import.meta.glob<{ default: ImageMetadata }>(
  '../../img/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}',
  { eager: true }
);

export const photo: ImageMetadata | undefined = Object.values(found)[0]?.default;

// Where the face sits in the photo (CSS object-position), used when
// cropping it to a square. Adjust if the crop cuts off the face.
export const photoFocus = '50% 45%';
