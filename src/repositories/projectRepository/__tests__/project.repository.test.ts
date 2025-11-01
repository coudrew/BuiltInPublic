import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProjectRepository } from '../project.repository';
import type { ProjectDTO } from '../project.types';
import type { AnySupabaseClient } from 'utils/supabase/server';

describe('ProjectRepository', () => {
  let mockSupabase: any;
  let repository: ProjectRepository;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    };

    repository = new ProjectRepository(mockSupabase as AnySupabaseClient);
  });

  describe('transformDTO', () => {
    it('should transform database DTO to Project object', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: {
          id: 'user-123',
          username: 'testuser',
        },
        name: 'Test Project',
        description: 'Test description',
        visibility: 'public',
        status: 'in-progress',
        external_url: 'https://example.com',
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result).toEqual({
        id: 'project-123',
        owner: {
          id: 'user-123',
          username: 'testuser',
        },
        name: 'Test Project',
        description: 'Test description',
        visibility: 'public',
        status: 'in-progress',
        externalUrl: 'https://example.com',
        primaryImage: undefined,
        galleryImages: undefined,
        createdAt: '2025-01-01T00:00:00Z',
        updates: [],
      });
    });

    it('should handle null description', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: null,
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.description).toBe('');
    });

    it('should handle null external_url', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.externalUrl).toBe('');
    });

    it('should transform primary_image to primaryImage', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: 'image-id-123',
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.primaryImage).toBe('image-id-123');
    });

    it('should transform gallery_images to galleryImages', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: ['img-1', 'img-2', 'img-3'],
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.galleryImages).toEqual(['img-1', 'img-2', 'img-3']);
    });

    it('should handle both primaryImage and galleryImages', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: 'primary-id',
        gallery_images: ['gallery-1', 'gallery-2'],
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.primaryImage).toBe('primary-id');
      expect(result.galleryImages).toEqual(['gallery-1', 'gallery-2']);
    });

    it('should handle null updates', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: null,
      };

      const result = repository.transformDTO(dto);

      expect(result.updates).toEqual([]);
    });

    it('should preserve updates array', () => {
      const updates = [
        {
          id: 'update-1',
          project_id: 'project-123',
          update: 'First update',
          created_at: '2025-01-02T00:00:00Z',
        },
        {
          id: 'update-2',
          project_id: 'project-123',
          update: 'Second update',
          created_at: '2025-01-03T00:00:00Z',
        },
      ];

      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates,
      };

      const result = repository.transformDTO(dto);

      expect(result.updates).toEqual(updates);
    });
  });

  describe('getById', () => {
    it('should fetch and transform project by id', async () => {
      const mockData: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test description',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: 'image-id',
        gallery_images: ['img-1', 'img-2'],
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockData,
        error: null,
      });

      const result = await repository.getById('project-123');

      expect(result).toBeDefined();
      expect(result?.id).toBe('project-123');
      expect(result?.primaryImage).toBe('image-id');
      expect(result?.galleryImages).toEqual(['img-1', 'img-2']);
    });

    it('should throw error if project not found', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(repository.getById('non-existent')).rejects.toThrow(
        'Project not found'
      );
    });

    it('should throw error on database error', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(repository.getById('project-123')).rejects.toThrow();
    });
  });

  describe('field transformations', () => {
    it('should convert snake_case to camelCase for externalUrl', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: 'https://github.com/project',
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.externalUrl).toBe('https://github.com/project');
      expect(result).not.toHaveProperty('external_url');
    });

    it('should convert snake_case to camelCase for createdAt', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: null,
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(result).not.toHaveProperty('created_at');
    });

    it('should handle empty gallery_images array', () => {
      const dto: ProjectDTO = {
        id: 'project-123',
        owner: { id: 'user-123', username: 'testuser' },
        name: 'Test Project',
        description: 'Test',
        visibility: 'public',
        status: 'in-progress',
        external_url: null,
        primary_image: null,
        gallery_images: [],
        created_at: '2025-01-01T00:00:00Z',
        updates: [],
      };

      const result = repository.transformDTO(dto);

      expect(result.galleryImages).toEqual([]);
    });
  });
});
