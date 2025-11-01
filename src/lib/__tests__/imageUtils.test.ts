import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateFileType,
  validateFileSize,
  convertToWebP,
  processImages,
  createPreviewURL,
  revokePreviewURL,
  IMAGE_CONFIG,
} from '../imageUtils';

describe('imageUtils', () => {
  describe('validateFileType', () => {
    it('should accept valid image types (JPEG, PNG, WebP)', () => {
      const jpeg = new File(['fake-content'], 'test.jpg', {
        type: 'image/jpeg',
      });
      const png = new File(['fake-content'], 'test.png', { type: 'image/png' });
      const webp = new File(['fake-content'], 'test.webp', {
        type: 'image/webp',
      });

      expect(validateFileType(jpeg)).toBe(true);
      expect(validateFileType(png)).toBe(true);
      expect(validateFileType(webp)).toBe(true);
    });

    it('should reject invalid file types', () => {
      const pdf = new File(['fake-content'], 'test.pdf', {
        type: 'application/pdf',
      });
      const noExt = new File(['fake-content'], 'test', { type: 'image/jpeg' });
      const wrongMime = new File(['fake-content'], 'test.jpg', {
        type: 'text/plain',
      });

      expect(validateFileType(pdf)).toBe(false);
      expect(validateFileType(noExt)).toBe(false);
      expect(validateFileType(wrongMime)).toBe(false);
    });
  });

  describe('validateFileSize', () => {
    it('should accept file under 10MB', () => {
      const file = new File(['x'.repeat(1024 * 1024)], 'test.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileSize(file)).toBe(true);
    });

    it('should reject file over 10MB', () => {
      const size = IMAGE_CONFIG.MAX_FILE_SIZE + 1;
      const file = new File(['x'.repeat(size)], 'test.jpg', {
        type: 'image/jpeg',
      });
      expect(validateFileSize(file)).toBe(false);
    });
  });

  describe('convertToWebP', () => {
    let mockCanvas: HTMLCanvasElement;
    let mockContext: CanvasRenderingContext2D;

    beforeEach(() => {
      // Mock canvas and context
      mockContext = {
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toBlob: vi.fn((callback, type, quality) => {
          const blob = new Blob(['fake-webp-data'], { type: 'image/webp' });
          callback(blob);
        }),
      } as unknown as HTMLCanvasElement;

      // Mock document.createElement for canvas
      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') return mockCanvas;
        return document.createElement(tag);
      });

      // Mock Image constructor
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        onerror: (() => void) | null = null;
        src = '';
        width = 800;
        height = 600;

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      // Mock FileReader
      global.FileReader = class MockFileReader {
        onload: ((event: any) => void) | null = null;
        onerror: (() => void) | null = null;
        result: string | null = null;

        readAsDataURL() {
          setTimeout(() => {
            this.result = 'data:image/jpeg;base64,fake-data';
            if (this.onload) {
              this.onload({ target: { result: this.result } } as any);
            }
          }, 0);
        }
      } as any;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should convert image to WebP format', async () => {
      const file = new File(['fake-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = await convertToWebP(file);

      expect(result.file.name).toBe('test.webp');
      expect(result.file.type).toBe('image/webp');
      expect(result.width).toBe(800);
      expect(result.height).toBe(600);
    });

    it('should resize large images and maintain aspect ratio', async () => {
      global.Image = class MockImage {
        onload: (() => void) | null = null;
        src = '';
        width = 4000;
        height = 2000;

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      const file = new File(['fake-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await convertToWebP(file);

      expect(mockCanvas.width).toBe(IMAGE_CONFIG.MAX_DIMENSION);
      const aspectRatio = mockCanvas.width / mockCanvas.height;
      expect(aspectRatio).toBeCloseTo(2, 1);
    });

    it('should reject if canvas context is null', async () => {
      mockCanvas.getContext = vi.fn(() => null);

      const file = new File(['fake-content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await expect(convertToWebP(file)).rejects.toThrow(
        'Failed to get canvas context'
      );
    });
  });

  describe('processImages', () => {
    beforeEach(() => {
      // Setup mocks similar to convertToWebP tests
      const mockContext = {
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D;

      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: vi.fn(() => mockContext),
        toBlob: vi.fn((callback) => {
          const blob = new Blob(['fake-webp-data'], { type: 'image/webp' });
          callback(blob);
        }),
      } as unknown as HTMLCanvasElement;

      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'canvas') return mockCanvas;
        return document.createElement(tag);
      });

      global.Image = class MockImage {
        onload: (() => void) | null = null;
        src = '';
        width = 800;
        height = 600;

        constructor() {
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        }
      } as any;

      global.FileReader = class MockFileReader {
        onload: ((event: any) => void) | null = null;
        result: string | null = null;

        readAsDataURL() {
          setTimeout(() => {
            this.result = 'data:image/jpeg;base64,fake-data';
            if (this.onload) {
              this.onload({ target: { result: this.result } } as any);
            }
          }, 0);
        }
      } as any;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should process multiple valid files', async () => {
      const files = [
        new File(['content1'], 'test1.jpg', { type: 'image/jpeg' }),
        new File(['content2'], 'test2.png', { type: 'image/png' }),
      ];

      const results = await processImages(files);

      expect(results).toHaveLength(2);
      expect(results[0].file.name).toBe('test1.webp');
      expect(results[1].file.name).toBe('test2.webp');
    });

    it('should reject files with validation errors', async () => {
      const invalidType = [
        new File(['content'], 'test.pdf', { type: 'application/pdf' }),
      ];
      await expect(processImages(invalidType)).rejects.toThrow(
        'Invalid file type: test.pdf'
      );

      const largeContent = 'x'.repeat(IMAGE_CONFIG.MAX_FILE_SIZE + 1);
      const tooLarge = [
        new File([largeContent], 'test.jpg', { type: 'image/jpeg' }),
      ];
      await expect(processImages(tooLarge)).rejects.toThrow(
        'File too large: test.jpg'
      );
    });
  });

  describe('URL utilities', () => {
    beforeEach(() => {
      if (!global.URL.createObjectURL) {
        global.URL.createObjectURL = vi.fn();
      }
      if (!global.URL.revokeObjectURL) {
        global.URL.revokeObjectURL = vi.fn();
      }
    });

    it('should create and revoke preview URLs', () => {
      const mockUrl = 'blob:http://localhost/fake-url';
      vi.mocked(URL.createObjectURL).mockReturnValue(mockUrl);

      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const url = createPreviewURL(file);

      expect(url).toBe(mockUrl);
      expect(URL.createObjectURL).toHaveBeenCalledWith(file);

      revokePreviewURL(url);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
    });
  });
});
