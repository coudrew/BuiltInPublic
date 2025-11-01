'use server';

import { createAnonClient } from 'utils/supabase/server';
import { randomUUID } from 'crypto';
import { ValidationError } from 'utils/errors/ValidationError';
import { imageUploadSchema, updateImageAltTextSchema } from './image.schema';
import { IMAGE_CONFIG } from '@/lib/imageUtils';
import type { User } from '@supabase/supabase-js';

export interface UploadImageInput {
  file: File;
  originalFilename: string;
  altText?: string;
  width: number;
  height: number;
}

export interface UploadResult {
  success: boolean;
  imageId?: string;
  publicUrl?: string;
  message: string;
}

export interface ImageData {
  id: string;
  publicUrl: string;
  originalFilename: string | null;
  altText: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  createdAt: string;
}

interface ImageRecord {
  id: string;
  storage_path: string;
  original_filename: string | null;
  alt_text: string | null;
  width: number | null;
  height: number | null;
  file_size: number | null;
  created_at: string;
  user_id: string;
}

const MAGIC_BYTES = {
  WEBP: [
    0x52,
    0x49,
    0x46,
    0x46,
    null,
    null,
    null,
    null,
    0x57,
    0x45,
    0x42,
    0x50,
  ],
  JPEG: [0xff, 0xd8, 0xff],
  PNG: [0x89, 0x50, 0x4e, 0x47],
} as const;

async function getAuthenticatedUser() {
  const supabase = await createAnonClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase };
  }

  return { user, supabase };
}

function checkMagicBytes(
  bytes: Uint8Array,
  pattern: readonly (number | null)[]
): boolean {
  return pattern.every((byte, i) => byte === null || bytes[i] === byte);
}

async function validateFile(
  file: File
): Promise<{ valid: boolean; error?: string }> {
  if (
    !IMAGE_CONFIG.ALLOWED_TYPES.includes(
      file.type as (typeof IMAGE_CONFIG.ALLOWED_TYPES)[number]
    )
  ) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
    };
  }

  if (file.size > IMAGE_CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: 'File too large. Maximum size is 10MB.' };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const isValid =
    checkMagicBytes(bytes, MAGIC_BYTES.WEBP) ||
    checkMagicBytes(bytes, MAGIC_BYTES.JPEG) ||
    checkMagicBytes(bytes, MAGIC_BYTES.PNG);

  if (!isValid) {
    return {
      valid: false,
      error: 'File content does not match declared type.',
    };
  }

  return { valid: true };
}

function buildStoragePath(
  userId: string,
  imageId: string,
  fileExt: string
): string {
  // Validate UUID format to prevent path traversal
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(userId) || !uuidRegex.test(imageId)) {
    throw new Error('Invalid user or image identifier');
  }
  return `${userId}/${imageId}.${fileExt}`;
}

function mapImageToData(supabase: any, img: ImageRecord): ImageData {
  const { data: urlData } = supabase.storage
    .from('images')
    .getPublicUrl(img.storage_path);

  return {
    id: img.id,
    publicUrl: urlData.publicUrl,
    originalFilename: img.original_filename,
    altText: img.alt_text,
    width: img.width,
    height: img.height,
    fileSize: img.file_size,
    createdAt: img.created_at,
  };
}

export async function uploadImage(
  input: UploadImageInput
): Promise<UploadResult> {
  try {
    const validated = imageUploadSchema.safeParse(input);

    if (!validated.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of validated.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      throw new ValidationError('Validation failed', errors);
    }

    const { user, supabase } = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        message: 'You must be logged in to upload images.',
      };
    }

    const { file, originalFilename, altText, width, height } = validated.data;

    const validation = await validateFile(file);
    if (!validation.valid) {
      return { success: false, message: validation.error! };
    }

    const imageId = randomUUID();
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'webp';

    // Validate file extension to prevent path traversal
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
    const sanitizedExt = allowedExtensions.includes(fileExt) ? fileExt : 'webp';

    const storagePath = buildStoragePath(user.id, imageId, sanitizedExt);

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      });

    if (uploadError) {
      return {
        success: false,
        message: 'Failed to upload file. Please try again.',
      };
    }

    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(storagePath);

    const { error: dbError } = await supabase.from('images').insert({
      id: imageId,
      user_id: user.id,
      storage_path: storagePath,
      original_filename: originalFilename,
      alt_text: altText || null,
      width,
      height,
      file_size: file.size,
    });

    if (dbError) {
      await supabase.storage.from('images').remove([storagePath]);
      return { success: false, message: 'Failed to save image metadata.' };
    }

    return {
      success: true,
      imageId,
      publicUrl: urlData.publicUrl,
      message: 'Image uploaded successfully',
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function deleteImage(
  imageId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    if (!user) {
      return {
        success: false,
        message: 'You must be logged in to delete images.',
      };
    }

    const { data: image, error: fetchError } = await supabase
      .from('images')
      .select('user_id, storage_path')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      return { success: false, message: 'Image not found.' };
    }

    if (image.user_id !== user.id) {
      return {
        success: false,
        message: 'You do not have permission to delete this image.',
      };
    }

    const { error: storageError } = await supabase.storage
      .from('images')
      .remove([image.storage_path]);

    const { error: dbError } = await supabase
      .from('images')
      .delete()
      .eq('id', imageId);

    if (dbError) {
      return { success: false, message: 'Failed to delete image record.' };
    }

    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function getUserImages(): Promise<{
  success: boolean;
  images?: ImageData[];
  message: string;
}> {
  try {
    const { user, supabase } = await getAuthenticatedUser();

    if (!user) {
      return { success: false, message: 'You must be logged in.' };
    }

    const { data: images, error } = await supabase
      .from('images')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, message: 'Failed to fetch images.' };
    }

    const imagesWithUrls: ImageData[] = images.map((img: ImageRecord) =>
      mapImageToData(supabase, img)
    );

    return {
      success: true,
      images: imagesWithUrls,
      message: 'Images fetched successfully',
    };
  } catch (error) {
    return { success: false, message: 'An unexpected error occurred.' };
  }
}

export async function updateImageAltText(data: {
  imageId: string;
  altText?: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const validated = updateImageAltTextSchema.safeParse(data);

    if (!validated.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of validated.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      throw new ValidationError('Validation failed', errors);
    }

    const { user, supabase } = await getAuthenticatedUser();

    if (!user) {
      return { success: false, message: 'You must be logged in.' };
    }

    const { data: image } = await supabase
      .from('images')
      .select('user_id')
      .eq('id', data.imageId)
      .single();

    if (!image || image.user_id !== user.id) {
      return { success: false, message: 'Image not found or unauthorized.' };
    }

    const { error } = await supabase
      .from('images')
      .update({ alt_text: data.altText || null })
      .eq('id', data.imageId);

    if (error) {
      return { success: false, message: 'Failed to update alt text.' };
    }

    return { success: true, message: 'Alt text updated successfully' };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    return { success: false, message: 'An unexpected error occurred.' };
  }
}
