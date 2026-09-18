/**
 * Utility to compress and downscale images before storing in LocalStorage / memory.
 * Prevents LocalStorage 5MB QuotaExceededError when uploading avatars, receipts, or logos.
 */

export async function compressImageFile(
  file: File,
  maxWidth = 300,
  maxHeight = 300,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File bukan gambar'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar'));
      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original reader result if canvas not supported
          return resolve(reader.result as string);
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP or JPEG with quality reduction (typically 10-30KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
