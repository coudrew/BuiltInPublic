/**
 * Client-side image processing utilities
 * Handles WebP conversion, resizing, and validation
 */

export const IMAGE_CONFIG = {
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_DIMENSION: 2000,
  QUALITY: 0.85,
} as const;

export interface ConversionOptions {
  maxDimension?: number;
  quality?: number;
}

export interface ConversionResult {
  file: File;
  width: number;
  height: number;
  originalSize: number;
  convertedSize: number;
}

/**
 * Validates file type using MIME type check
 * SR-IMG-006, SR-IMG-008
 */
export function validateFileType(file: File): boolean {
  // Narrow the string type to the literal union from IMAGE_CONFIG for the includes check
  if (
    !IMAGE_CONFIG.ALLOWED_TYPES.includes(
      file.type as (typeof IMAGE_CONFIG.ALLOWED_TYPES)[number]
    )
  ) {
    return false;
  }

  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];

  return extension ? validExtensions.includes(extension) : false;
}

/**
 * Validates file size
 */
export function validateFileSize(file: File): boolean {
  return file.size <= IMAGE_CONFIG.MAX_FILE_SIZE;
}

/**
 * Converts image to WebP format with resizing and compression
 */
export async function convertToWebP(
  file: File,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const maxDimension = options.maxDimension || IMAGE_CONFIG.MAX_DIMENSION;
  const quality = options.quality || IMAGE_CONFIG.QUALITY;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      let { width, height } = img;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = Math.round(width);
      canvas.height = Math.round(height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          const webpFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.webp'),
            { type: 'image/webp' }
          );

          resolve({
            file: webpFile,
            width: canvas.width,
            height: canvas.height,
            originalSize: file.size,
            convertedSize: blob.size,
          });
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Process multiple images
 */
export async function processImages(
  files: File[],
  options: ConversionOptions = {}
): Promise<ConversionResult[]> {
  const results: ConversionResult[] = [];

  for (const file of files) {
    if (!validateFileType(file)) {
      throw new Error(
        `Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`
      );
    }
    
    if (!validateFileSize(file)) {
      throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
    }

    const result = await convertToWebP(file, options);
    results.push(result);
  }

  return results;
}

/**
 * Create a preview URL for display before upload
 */
export function createPreviewURL(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL to prevent memory leaks
 */
export function revokePreviewURL(url: string): void {
  URL.revokeObjectURL(url);
}