/**
 * Client-side image processing utilities
 * Handles WebP conversion, resizing, and validation
 */

// Allowed MIME types (SR-IMG-006)
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const MAX_DIMENSION = 2000; // pixels
const QUALITY = 0.85; // WebP quality

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
 */
export function validateFileType(file: File): boolean {
  // Check MIME type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return false;
  }
  
  // Check extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  
  return extension ? validExtensions.includes(extension) : false;
}

/**
 * Validates file size
 * SR-IMG-007
 */
export function validateFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Converts image to WebP format with resizing and compression
 * SR-IMG-017 - Critical for server action size limits!
 */
export async function convertToWebP(
  file: File,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const maxDimension = options.maxDimension || MAX_DIMENSION;
  const quality = options.quality || QUALITY;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
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

      // Set canvas dimensions
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      // Draw and convert to WebP
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to convert image'));
            return;
          }

          // Create new File object
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

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
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
    // Validate type and size
    if (!validateFileType(file)) {
      throw new Error(`Invalid file type: ${file.name}. Only JPEG, PNG, and WebP are allowed.`);
    }
    
    if (!validateFileSize(file)) {
      throw new Error(`File too large: ${file.name}. Maximum size is 10MB.`);
    }

    // Convert to WebP
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