/**
 * Compress an image file to max ~50KB using iterative quality reduction.
 * @param {File} file - original image file
 * @param {object} opts
 * @param {number} opts.maxWidth - max width in pixels (default 1200)
 * @param {number} opts.maxHeight - max height in pixels (default 900)
 * @param {number} opts.maxSizeKB - target max size in KB (default 50)
 * @returns {Promise<{ file: File, originalSize: number, compressedSize: number }>}
 */
export function compressImage(file, { maxWidth = 1200, maxHeight = 900, maxSizeKB = 50 } = {}) {
  const originalSize = file.size;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Scale down if超出 max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const tryCompress = (quality) => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ file, originalSize, compressedSize: originalSize });
                return;
              }

              if (blob.size <= maxSizeKB * 1024) {
                const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve({ file: compressed, originalSize, compressedSize: compressed.size });
                return;
              }

              if (quality > 0.15) {
                tryCompress(quality - 0.1);
                return;
              }

              if (width > 200 && height > 200) {
                width = Math.round(width * 0.7);
                height = Math.round(height * 0.7);
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                tryCompress(0.6);
                return;
              }

              const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve({ file: compressed, originalSize, compressedSize: compressed.size });
            },
            'image/jpeg',
            quality,
          );
        };

        tryCompress(0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple files in parallel.
 * @param {FileList|File[]} files
 * @param {object} opts - same as compressImage opts
 * @returns {Promise<Array<{ file: File, originalSize: number, compressedSize: number }>>}
 */
export async function compressImages(files, opts) {
  return Promise.all(Array.from(files).map((f) => compressImage(f, opts)));
}

/**
 * Format bytes to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
