import { SupabaseAnonClient } from 'utils/supabase/server';
import { beforeEach, expect, it, vi, describe } from 'vitest';
import { EditProject } from '../EditProject';

const mockUpdate = vi.fn();
const mockSupabase = {
  from: (table: string) => mockSupabase,
  update: mockUpdate,
  eq: vi.fn().mockResolvedValue({ error: null, data: { id: 'test-id' } }),
} as unknown as SupabaseAnonClient;

const mockUpdateFails = vi.fn();
const mockSupabaseFails = {
  from: (table: string) => mockSupabaseFails,
  update: mockUpdateFails,
  eq: vi.fn().mockResolvedValue({
    error: { message: 'violation or whatever', code: 'string' },
  }),
} as unknown as SupabaseAnonClient;

describe('Use case - EditProject', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockUpdate.mockReturnValue(mockSupabase);
    mockUpdateFails.mockReturnValue(mockSupabaseFails);
  });

  it('returns success: true and a message if update succeeds', async () => {
    const editProject = new EditProject(mockSupabase);

    const actual = await editProject.execute({
      description: 'a test project for testing project tests',
      projectId: 'test-id',
    });

    expect(actual.success).toBe(true);
    expect(actual.message).toBe('Project updated!');
  });

  it('returns success: false and a message if update fails', async () => {
    const editProject = new EditProject(mockSupabaseFails);

    const actual = await editProject.execute({ 
      projectId: 'test-id',
      name: 'Some Name' // Provide at least one field to update
    });

    expect(actual.success).toBe(false);
    expect(actual.message).toBe('Project update failed');
  });

  it.each([
    'rick and morty a hundred years forever',
    'www.hundredyears.rickandmorty.com',
    'ww.wwww.rickandmorty.hundred.yearsadventure.com',
  ])('fails if a provided URL is invalid', async (url) => {
    const editProject = new EditProject(mockSupabase);

    const actual = await editProject.execute({
      external_url: url,
      projectId: 'test-id',
    });

    expect(actual.success).toBe(false);
    expect(actual.message).toBe('Must be valid URL');
  });

  it('sanitizes descriptions', async () => {
    const editProject = new EditProject(mockSupabase);

    const actual = await editProject.execute({
      description: '<script>window.alert()</script>malicious descriptious',
      projectId: 'test-id',
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      description: 'malicious descriptious',
    });
  });

  it('sanitizes name updates', async () => {
    const editProject = new EditProject(mockSupabase);

    const actual = await editProject.execute({
      name: '<script>window.alert()</script>bad name',
      projectId: 'test-id',
    });

    expect(mockUpdate).toHaveBeenCalledWith({ name: 'bad name' });
  });

  it('fails if sanitized name update results in an empty string', async () => {
    const editProject = new EditProject(mockSupabase);

    const actual = await editProject.execute({
      name: '<script>window.alert()</script>',
      projectId: 'test-id',
    });

    expect(actual.success).toBe(false);
    expect(actual.message).toBe('Name cannot be blank');
  });

  describe('image updates', () => {
    it('should update primaryImage field with snake_case conversion', async () => {
      const editProject = new EditProject(mockSupabase);

      await editProject.execute({
        primaryImage: 'image-id-123',
        projectId: 'test-id',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        primary_image: 'image-id-123',
      });
    });

    it('should update galleryImages field with snake_case conversion', async () => {
      const editProject = new EditProject(mockSupabase);

      await editProject.execute({
        galleryImages: ['image-1', 'image-2', 'image-3'],
        projectId: 'test-id',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        gallery_images: ['image-1', 'image-2', 'image-3'],
      });
    });

    it('should update both primaryImage and galleryImages together', async () => {
      const editProject = new EditProject(mockSupabase);

      await editProject.execute({
        primaryImage: 'primary-id',
        galleryImages: ['gallery-1', 'gallery-2'],
        projectId: 'test-id',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        primary_image: 'primary-id',
        gallery_images: ['gallery-1', 'gallery-2'],
      });
    });

    it('should clear gallery images with empty array', async () => {
      const editProject = new EditProject(mockSupabase);

      await editProject.execute({
        galleryImages: [],
        projectId: 'test-id',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        gallery_images: [],
      });
    });

    it('should update images along with other fields', async () => {
      const editProject = new EditProject(mockSupabase);

      await editProject.execute({
        name: 'Updated Project',
        description: 'Updated description',
        primaryImage: 'new-image',
        galleryImages: ['img-1', 'img-2'],
        projectId: 'test-id',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        name: 'Updated Project',
        description: 'Updated description',
        primary_image: 'new-image',
        gallery_images: ['img-1', 'img-2'],
      });
    });

    it('should handle status and visibility with image updates', async () => {
      const editProject = new EditProject(mockSupabase);

      await editProject.execute({
        status: 'completed',
        visibility: 'public',
        primaryImage: 'final-image',
        projectId: 'test-id',
      });

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'completed',
        visibility: 'public',
        primary_image: 'final-image',
      });
    });
  });
});
