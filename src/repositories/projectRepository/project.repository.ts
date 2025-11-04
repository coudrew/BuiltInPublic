import { BaseRepository } from '@/repositories/base.repository';
import { AnySupabaseClient, isServiceRoleClient } from 'utils/supabase/server';
import { Project, ProjectDTO } from './project.types';

// This class extends the BaseRepository to provide specific methods for the Project entity
export class ProjectRepository extends BaseRepository<ProjectDTO, Project> {
  constructor(supabase: AnySupabaseClient) {
    super(supabase);
  }

  // Get the projects from the database and the project updates then join them to include the updates in the project data and project owners username
  getRawBaseQuery(count: boolean = false) {
    const query = this.supabase
      .from('projects')
      .select(
        '*, owner:profiles!inner(id, username), updates:project_updates(*)',
        count ? { count: 'exact' } : undefined
      );

    return query;
  }

  // Transform the raw database row into a Project object
  transformDTO(row: ProjectDTO): Project {
    const {
      id,
      owner,
      name,
      description,
      visibility,
      status,
      external_url,
      primary_image,
      gallery_images,
      created_at,
      updates,
    } = row;

    return {
      id,
      owner: {
        id: owner.id,
        username: owner.username,
      },
      name,
      description: description || '',
      visibility,
      status,
      externalUrl: external_url || '',
      primaryImage: primary_image || undefined,
      galleryImages: gallery_images || undefined,
      createdAt: created_at,
      updates: updates || [],
    } satisfies Project;
  }

  async getPublicProjectById(id: string): Promise<Project | null> {
    if (!isServiceRoleClient(this.supabase)) {
      throw new Error('Service Role Client required');
    }
    try {
      const query = this.getBaseQuery();

      const { data, error } = await this.applyFilters(query, {
        id,
        visibility: 'public',
      }).maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Project not found');
      }

      const project = this.safeTransformDTO(data);

      return project;
    } catch (e) {
      throw e;
    }
  }

  async getById(id: string): Promise<Project | null> {
    try {
      const query = this.getBaseQuery();

      const { data, error } = await this.applyFilters(query, {
        id,
      }).maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Project not found');
      }

      const project = this.safeTransformDTO(data);

      return project;
    } catch (e) {
      throw e;
    }
  }

  async getProjectsByUsernameWithPagination(
    username: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ projects: Project[]; totalCount: number } | null> {
    try {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get total count using a separate count query with proper join
      const { count, error: countError } = await this.supabase
        .from('projects')
        .select('id, profiles!inner(username)', { count: 'exact', head: true })
        .eq('profiles.username', username);

      if (countError) {
        throw countError;
      }

      // Get paginated data
      const query = this.getBaseQuery().range(from, to);
      const { data, error } = await this.applyFilters(query, {
        'profiles.username': username,
      });

      if (error) {
        throw error;
      }

      // Use map instead of for loop for better performance
      const projects = data?.map((rawProject: ProjectDTO) => this.safeTransformDTO(rawProject)) || [];

      return {
        projects,
        totalCount: count ?? 0,
      };
    } catch (e) {
      console.error('Error fetching paginated projects:', e);
      throw e;
    }
  }
}
