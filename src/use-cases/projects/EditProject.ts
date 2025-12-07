import { Database } from 'supabase/supabase.types';
import { BaseMutationUseCase } from '../BaseMutationUseCase';
import xss from 'xss';
import { SecureURLValidator } from 'utils/SecureURLValidator/SecureURLValidator';

export interface UpdateProjectParams {
  projectId: string;
  name?: string;
  visibility?: Database['public']['Enums']['project_visibility'];
  status?: Database['public']['Enums']['project_status'];
  description?: string;
  external_url?: string;
  primaryImage?: string;
  galleryImages?: string[];
}

export class EditProject extends BaseMutationUseCase<UpdateProjectParams> {
  async execute({
    projectId,
    name,
    visibility,
    status,
    description,
    external_url,
    primaryImage,
    galleryImages,
  }: UpdateProjectParams): Promise<{ success: boolean; message: string }> {
    const sanitizedName = name
      ? xss(name, {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script'],
        }).trim()
      : undefined;

    if (name && !sanitizedName) {
      return { success: false, message: 'Name cannot be blank' };
    }

    const sanitizedDescription = description
      ? xss(description, {
          whiteList: {},
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script'],
        }).trim()
      : undefined;

    let validatedUrl: string | undefined = undefined;
    if (external_url) {
      const urlValidator = new SecureURLValidator();
      const result = await urlValidator.validate(external_url);

      if (!result.isValid) {
        return { success: false, message: 'Must be valid URL' };
      }

      validatedUrl = result.sanitizedUrl;
    }

    try {
      const updateData: any = {
        name: sanitizedName,
        description: sanitizedDescription,
        external_url: validatedUrl,
        visibility,
        status,
      };

      // Map camelCase to snake_case for database columns
      if (primaryImage !== undefined) {
        updateData.primary_image = primaryImage;
      }
      if (galleryImages !== undefined) {
        updateData.gallery_images = galleryImages;
      }

      // Remove undefined values
      const update = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
      );

      if (!Object.keys(update).length) {
        return { success: false, message: 'No fields to update' };
      }

      const { error } = await this.supabase
        .from('projects')
        .update(update)
        .eq('id', projectId);

      if (error) {
        throw error;
      }

      return { success: true, message: 'Project updated!' };
    } catch (e) {
      console.error(
        `Update failed for project: ${projectId} with: ${JSON.stringify(e, null, 2)}`
      );
      return { success: false, message: 'Project update failed' };
    }
  }
}
