import { Database } from 'supabase/supabase.types';

export type ProjectVisibility =
  Database['public']['Tables']['projects']['Row']['visibility'];
export type ProjectStatus =
  Database['public']['Tables']['projects']['Row']['status'];

// Create interface for the project data transfer object (DTO)
export interface ProjectDTO {
  id: string;
  owner: {
    id: string;
    username: string;
  };
  name: string;
  description: string | null;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  external_url: string | null;
  primary_image: string | null;
  gallery_images: string[] | null;
  created_at: string;
  updates:
    | {
        id: string;
        project_id: string;
        created_at: string;
        update: string;
      }[]
    | null;
}

// Create interface for the project entity
export interface Project {
  id: string;
  owner: {
    id: string;
    username: string;
  };
  name: string;
  description?: string;
  visibility: ProjectVisibility;
  status: ProjectStatus;
  externalUrl?: string;
  createdAt: string;
  primaryImage?: string;
  galleryImages?: string[];
  updates:
    | {
        id: string;
        project_id: string;
        created_at: string;
        update: string;
      }[]
    | null;
}
