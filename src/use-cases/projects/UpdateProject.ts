import xss from 'xss';
import { BaseMutationUseCase } from '../BaseMutationUseCase';
import { Project } from '@/repositories/projectRepository/project.types';
import { Database } from 'supabase/supabase.types';

export interface UpdateProjectParams {
  projectId: string;
  name?: string;
  description?: string;
  status?: Database['public']['Enums']['project_status'];
  visibility?: Database['public']['Enums']['project_visibility'];
  primaryImage?: string;
  galleryImages?: string[];
  update?: string;
}

export class UpdateProject extends BaseMutationUseCase<
  UpdateProjectParams,
  Project | null
> {
  async execute(params: UpdateProjectParams): Promise<Project | null> {
    const { projectId, update, primaryImage, galleryImages, ...updateFields } =
      params;

    // If there's an update message, create a project update
    if (update) {
      const sanitizedUpdate = xss(update, {
        whiteList: {},
        stripIgnoreTag: true,
        stripIgnoreTagBody: ['script'],
      }).trim();

      if (sanitizedUpdate) {
        const { error } = await this.supabase
          .from('project_updates')
          .insert({ project_id: projectId, update: sanitizedUpdate });

        if (error) {
          throw new Error('Creating Update failed');
        }
      }
    }

    // Build update object with correct column names
    const updateData: any = {
      ...updateFields,
      updated_at: new Date().toISOString(),
    };

    if (primaryImage !== undefined) {
      updateData.primary_image = primaryImage;
    }
    if (galleryImages !== undefined) {
      updateData.gallery_images = galleryImages;
    }

    // Update project fields
    const { data: updatedProject, error: updateError } = await this.supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .select(
        `
        *,
        owner:owner_id (
          id,
          username
        )
      `
      )
      .single();

    if (updateError) {
      throw new Error(`Failed to update project: ${updateError.message}`);
    }

    if (!updatedProject) {
      throw new Error('Failed to update project - no data returned');
    }

    // Fetch project updates separately
    const { data: updates } = await this.supabase
      .from('project_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Fetch image URLs if we have image IDs
    let primaryImageUrl: string | undefined = undefined;
    let galleryImageUrls: string[] | undefined = undefined;

    if (updatedProject.primary_image) {
      const { data: primaryImageData } = await this.supabase
        .from('images')
        .select('storage_path')
        .eq('id', updatedProject.primary_image)
        .single();

      if (primaryImageData?.storage_path) {
        const { data } = this.supabase.storage
          .from('images')
          .getPublicUrl(primaryImageData.storage_path);
        primaryImageUrl = data.publicUrl;
      }
    }

    if (
      updatedProject.gallery_images &&
      updatedProject.gallery_images.length > 0
    ) {
      const { data: galleryImagesData } = await this.supabase
        .from('images')
        .select('id, storage_path')
        .in('id', updatedProject.gallery_images);

      if (galleryImagesData) {
        galleryImageUrls = galleryImagesData.map((img) => {
          const { data } = this.supabase.storage
            .from('images')
            .getPublicUrl(img.storage_path);
          return data.publicUrl;
        });
      }
    }

    // Map the response to our Project type
    return {
      id: updatedProject.id,
      owner: {
        id: updatedProject.owner.id,
        username: updatedProject.owner.username || '',
      },
      name: updatedProject.name,
      description: updatedProject.description || undefined,
      visibility: updatedProject.visibility,
      status: updatedProject.status,
      primaryImage: primaryImageUrl,
      galleryImages: galleryImageUrls,
      externalUrl: updatedProject.external_url || undefined,
      createdAt: updatedProject.created_at,
      updates: updates || [],
    };
  }
}
