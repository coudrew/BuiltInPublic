import { describe, it, expect } from 'vitest';
import {
  imageUploadSchema,
  updateImageAltTextSchema,
} from '../image.schema';
import { IMAGE_CONFIG } from '@/lib/imageUtils';

describe('Image Schemas', () => {
  describe('imageUploadSchema', () => {
    it('should accept valid complete input', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        altText: 'Test image',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.file).toBe(file);
        expect(result.data.originalFilename).toBe('test.jpg');
        expect(result.data.altText).toBe('Test image');
        expect(result.data.width).toBe(800);
        expect(result.data.height).toBe(600);
      }
    });

    it('should accept valid input without altText', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.altText).toBe('');
      }
    });

    it('should accept JPEG file type', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept PNG file type', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const input = {
        file,
        originalFilename: 'test.png',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should accept WebP file type', () => {
      const file = new File(['content'], 'test.webp', { type: 'image/webp' });
      const input = {
        file,
        originalFilename: 'test.webp',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it('should reject invalid file type', () => {
      const file = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const input = {
        file,
        originalFilename: 'test.pdf',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid file type');
      }
    });

    it('should reject file exceeding size limit', () => {
      const largeContent = 'x'.repeat(IMAGE_CONFIG.MAX_FILE_SIZE + 1);
      const file = new File([largeContent], 'test.jpg', {
        type: 'image/jpeg',
      });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('File too large');
      }
    });

    it('should reject missing file', () => {
      const input = {
        originalFilename: 'test.jpg',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject missing originalFilename', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject empty originalFilename', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: '',
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(
          'Filename is required'
        );
      }
    });

    it('should reject originalFilename exceeding 255 characters', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'x'.repeat(256),
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no more than 255');
      }
    });

    it('should reject altText exceeding 500 characters', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        altText: 'x'.repeat(501),
        width: 800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no more than 500');
      }
    });

    it('should reject missing width', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject missing height', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject negative width', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: -800,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject zero width', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 0,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject negative height', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
        height: -600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject zero height', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
        height: 0,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('positive');
      }
    });

    it('should reject non-integer width', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800.5,
        height: 600,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject non-integer height', () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const input = {
        file,
        originalFilename: 'test.jpg',
        width: 800,
        height: 600.5,
      };

      const result = imageUploadSchema.safeParse(input);

      expect(result.success).toBe(false);
    });
  });

  describe('updateImageAltTextSchema', () => {
    it('should accept valid UUID and alt text', () => {
      const input = {
        imageId: '123e4567-e89b-12d3-a456-426614174000',
        altText: 'Updated alt text',
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.imageId).toBe(input.imageId);
        expect(result.data.altText).toBe(input.altText);
      }
    });

    it('should accept valid UUID without alt text', () => {
      const input = {
        imageId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should accept empty alt text', () => {
      const input = {
        imageId: '123e4567-e89b-12d3-a456-426614174000',
        altText: '',
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(true);
    });

    it('should reject invalid UUID format', () => {
      const input = {
        imageId: 'invalid-uuid',
        altText: 'Test',
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid image ID');
      }
    });

    it('should reject missing imageId', () => {
      const input = {
        altText: 'Test',
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(false);
    });

    it('should reject alt text exceeding 500 characters', () => {
      const input = {
        imageId: '123e4567-e89b-12d3-a456-426614174000',
        altText: 'x'.repeat(501),
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('no more than 500');
      }
    });

    it('should accept alt text at exactly 500 characters', () => {
      const input = {
        imageId: '123e4567-e89b-12d3-a456-426614174000',
        altText: 'x'.repeat(500),
      };

      const result = updateImageAltTextSchema.safeParse(input);

      expect(result.success).toBe(true);
    });
  });
});
