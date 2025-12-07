import { SupabaseAnonClient } from 'utils/supabase/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateProject } from '../UpdateProject';

describe('Use case - UpdateProject', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockResolvedValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'project-123',
          owner: { id: 'user-123', username: 'testuser' },
          name: 'Test Project',
          description: 'Test description',
          visibility: 'public',
          status: 'in-progress',
          external_url: null,
          primary_image: null,
          gallery_images: null,
          created_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      }),
      storage: {
        from: vi.fn().mockReturnThis(),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/image.webp' },
        }),
      },
    };
  });

  describe('project update messages', () => {
    it('should create project update with sanitized text', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        update: 'New update message',
      });

      expect(mockSupabase.from).toHaveBeenCalledWith('project_updates');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        project_id: 'project-123',
        update: 'New update message',
      });
    });

    it('should sanitize XSS in update message', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        update: '<script>alert("xss")</script>Clean text',
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        project_id: 'project-123',
        update: 'Clean text',
      });
    });

    it('should throw error if update creation fails', async () => {
      mockSupabase.insert.mockResolvedValue({
        error: new Error('Database error'),
      });

      const updateProject = new UpdateProject(mockSupabase);

      await expect(
        updateProject.execute({
          projectId: 'project-123',
          update: 'Test update',
        })
      ).rejects.toThrow('Creating Update failed');
    });
  });

  describe('project field updates', () => {
    it('should update project fields and return Project object', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      const result = await updateProject.execute({
        projectId: 'project-123',
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(result).toBeDefined();
      expect(result?.id).toBe('project-123');
      expect(result?.name).toBe('Test Project');
    });

    it('should update project with name', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        name: 'New Name',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Name',
          updated_at: expect.any(String),
        })
      );
    });

    it('should update project with description', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        description: 'New description',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'New description',
          updated_at: expect.any(String),
        })
      );
    });

    it('should update project with status', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        status: 'completed',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          updated_at: expect.any(String),
        })
      );
    });

    it('should update project with visibility', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        visibility: 'private',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'private',
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error if project update fails', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      });

      const updateProject = new UpdateProject(mockSupabase);

      await expect(
        updateProject.execute({
          projectId: 'project-123',
          name: 'New Name',
        })
      ).rejects.toThrow('Failed to update project');
    });

    it('should throw error if no data returned', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: null,
      });

      const updateProject = new UpdateProject(mockSupabase);

      await expect(
        updateProject.execute({
          projectId: 'project-123',
          name: 'New Name',
        })
      ).rejects.toThrow('Failed to update project - no data returned');
    });
  });

  describe('image updates', () => {
    it('should update project with primaryImage', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        primaryImage: 'image-id-123',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          primary_image: 'image-id-123',
          updated_at: expect.any(String),
        })
      );
    });

    it('should update project with galleryImages array', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        galleryImages: ['image-1', 'image-2', 'image-3'],
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          gallery_images: ['image-1', 'image-2', 'image-3'],
          updated_at: expect.any(String),
        })
      );
    });

    it('should update both primaryImage and galleryImages', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        primaryImage: 'primary-id',
        galleryImages: ['gallery-1', 'gallery-2'],
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          primary_image: 'primary-id',
          gallery_images: ['gallery-1', 'gallery-2'],
          updated_at: expect.any(String),
        })
      );
    });

    it('should fetch and map primary image URL', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
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
        },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { storage_path: 'user-123/image.webp' },
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const updateProject = new UpdateProject(mockSupabase);

      const result = await updateProject.execute({
        projectId: 'project-123',
        primaryImage: 'image-id-123',
      });

      expect(result?.primaryImage).toBe('https://example.com/image.webp');
    });

    it('should fetch and map gallery image URLs', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'project-123',
          owner: { id: 'user-123', username: 'testuser' },
          name: 'Test Project',
          description: 'Test',
          visibility: 'public',
          status: 'in-progress',
          external_url: null,
          primary_image: null,
          gallery_images: ['image-1', 'image-2'],
          created_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'images') {
          return {
            select: vi.fn().mockReturnThis(),
            in: vi.fn().mockResolvedValue({
              data: [
                { id: 'image-1', storage_path: 'path1.webp' },
                { id: 'image-2', storage_path: 'path2.webp' },
              ],
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const updateProject = new UpdateProject(mockSupabase);

      const result = await updateProject.execute({
        projectId: 'project-123',
        galleryImages: ['image-1', 'image-2'],
      });

      expect(result?.galleryImages).toHaveLength(2);
      expect(result?.galleryImages).toEqual([
        'https://example.com/image.webp',
        'https://example.com/image.webp',
      ]);
    });

    it('should handle missing image data gracefully', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'project-123',
          owner: { id: 'user-123', username: 'testuser' },
          name: 'Test Project',
          description: 'Test',
          visibility: 'public',
          status: 'in-progress',
          external_url: null,
          primary_image: 'missing-image',
          gallery_images: null,
          created_at: '2025-01-01T00:00:00Z',
        },
        error: null,
      });

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'images') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return mockSupabase;
      });

      const updateProject = new UpdateProject(mockSupabase);

      const result = await updateProject.execute({
        projectId: 'project-123',
      });

      expect(result?.primaryImage).toBeUndefined();
    });
  });

  describe('combined updates', () => {
    it('should update both text fields and images together', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        name: 'Updated Name',
        description: 'Updated description',
        primaryImage: 'new-image-id',
        galleryImages: ['gallery-1'],
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          description: 'Updated description',
          primary_image: 'new-image-id',
          gallery_images: ['gallery-1'],
          updated_at: expect.any(String),
        })
      );
    });

    it('should create update message and update fields together', async () => {
      const updateProject = new UpdateProject(mockSupabase);

      await updateProject.execute({
        projectId: 'project-123',
        update: 'Progress update',
        status: 'completed',
      });

      expect(mockSupabase.insert).toHaveBeenCalledWith({
        project_id: 'project-123',
        update: 'Progress update',
      });

      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          updated_at: expect.any(String),
        })
      );
    });
  });
});
