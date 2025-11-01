import { z } from 'zod';
import { IMAGE_CONFIG } from '@/lib/imageUtils';

/**
 * Schema for image upload input
 */

export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as typeof IMAGE_CONFIG.ALLOWED_TYPES[number]),
      'Invalid file type. Only JPEG, PNG, and WebP are allowed.'
    )
    .refine(
      (file) => file.size <= IMAGE_CONFIG.MAX_FILE_SIZE,
      'File too large. Maximum size is 10MB.'
    ),
  originalFilename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must be no more than 255 characters'),
  altText: z
    .string()
    .max(500, 'Alt text must be no more than 500 characters')
    .optional()
    .default(''),
  width: z.number().int().positive('Width must be a positive number'),
  height: z.number().int().positive('Height must be a positive number'),
});

/**
 * Schema for image metadata
 */
export const imageMetadataSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  storagePath: z.string(),
  originalFilename: z.string(),
  altText: z.string().optional(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  fileSize: z.number().int().positive(),
  createdAt: z.string().datetime(),
});

/**
 * Schema for updating image alt text
 */
export const updateImageAltTextSchema = z.object({
  imageId: z.string().uuid('Invalid image ID'),
  altText: z
    .string()
    .max(500, 'Alt text must be no more than 500 characters')
    .optional(),
});

export type ImageUploadInput = z.infer<typeof imageUploadSchema>;
export type ImageMetadata = z.infer<typeof imageMetadataSchema>;
export type UpdateImageAltTextInput = z.infer<typeof updateImageAltTextSchema>;
