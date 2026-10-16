'use client';

import { supabase } from './supabase/client';

export function resizeImage(file: File, maxWidth = 1920, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no canvas context');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('resize failed'))),
          'image/jpeg',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Center-crops an image to a square, then resizes it to `size`×`size` px.
 * Used for profile avatars so every stored file is small (250px default) —
 * the resulting JPEG is typically just a few KB, keeping storage usage low.
 * The crop is centered, so it never loses the subject's edges unfairly.
 */
export function cropAvatar(file: File, size = 250, quality = 0.82): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('no canvas context');

        // JPEG has no alpha channel, so fill the canvas with white first —
        // otherwise transparent PNGs get black corners after the crop.
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);

        // Center-crop the source into a square, then downscale to `size`.
        const srcSize = Math.min(img.width, img.height);
        const srcX = (img.width - srcSize) / 2;
        const srcY = (img.height - srcSize) / 2;
        ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, size, size);

        URL.revokeObjectURL(url);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('crop failed'))),
          'image/jpeg',
          quality
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('failed to load image'));
    };
    img.src = url;
  });
}

/**
 * Uploads an image to the `gallery` storage bucket after resizing it to
 * maxWidth. Returns the storage path (e.g. "gallery/events/123/x.jpg").
 */
export async function uploadImage(
  file: File,
  folder: string,
  maxWidth = 1920
): Promise<string> {
  const blob = await resizeImage(file, maxWidth);
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from('gallery').upload(path, blob, {
    cacheControl: '3600',
    contentType: 'image/jpeg',
    upsert: false
  });
  if (error) throw error;
  return `gallery/${path}`;
}

export async function deleteImage(path: string): Promise<void> {
  if (!path || !path.startsWith('gallery/')) return;
  const { error } = await supabase.storage.from('gallery').remove([path.replace('gallery/', '')]);
  if (error) throw error;
}
