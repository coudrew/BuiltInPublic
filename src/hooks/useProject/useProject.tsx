'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  editProject,
  getProjectById,
  getProjectsByUsername,
  updateProject,
  deleteProject,
} from './actions';
import { createProject } from '@/components/Projects/CreateProject/actions';
import UINotification from '@/services/UINotification.service';
import { ValidationError } from 'utils/errors/ValidationError';

const projectQueryKeys = {
  all: ['project'] as const,
  projectId: (projectId: string) => [...projectQueryKeys.all, projectId] as const,
  username: (username: string) => [...projectQueryKeys.all, username] as const,
};

function handleQueryError(error: Error) {
  UINotification.error('Error fetching projects');
}

export default function useProject(projectId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: projectQueryKeys.projectId(projectId),
    queryFn: () => getProjectById(projectId),
  });

  if (error) handleQueryError(error);

  return { data, isLoading, error };
}

export function useProjects(username?: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: projectQueryKeys.username(username || ''),
    queryFn: () => getProjectsByUsername(username || ''),
    enabled: Boolean(username),
    refetchOnMount: 'always',
  });

  if (error) handleQueryError(error);

  return { data, isLoading, error };
}

export function useEditProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: editProject,
    onMutate: async ({ projectId }) => {
      await queryClient.cancelQueries({
        queryKey: projectQueryKeys.projectId(projectId),
      });

      const previousProject = queryClient.getQueryData(
        projectQueryKeys.projectId(projectId)
      );

      return { previousProject, projectId };
    },

    onSuccess: () => {
      UINotification.success('Project updated successfully');
    },

    onError: (error, _variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(
          projectQueryKeys.projectId(context.projectId),
          context.previousProject
        );
      }

      if (error instanceof ValidationError) return;
      UINotification.error(error.message || 'Failed to update project');
    },

    onSettled: (_data, _error, { projectId }) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.projectId(projectId),
      });
      queryClient.invalidateQueries({ queryKey: projectQueryKeys.all });
    },
  });

  return mutation;
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: createProject,
    onSuccess: (_result, { username }) => {
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.username(username),
      });
    },
    onError: (error) => {
      if (error.message === 'NEXT_REDIRECT') {
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.all,
          exact: false,
        });
        return;
      }
      if (error instanceof ValidationError) return;
      UINotification.error(error.message);
    },
  });

  return mutation;
}

export function useUpdateProject(projectId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: updateProject,
    onSuccess: (result) => {
      if (result?.message) {
        UINotification.success(result.message);
      }
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.projectId(projectId),
      });
    },
    onError: (error) => {
      if (error instanceof ValidationError) return;
      UINotification.error(error.message);
    },
  });

  return mutation;
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteProject,
    onSuccess: (_result, { projectId }) => {
      queryClient.removeQueries({
        queryKey: projectQueryKeys.projectId(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: projectQueryKeys.all,
        exact: false,
      });
    },
    onError: (error, { projectId }) => {
      if (error.message === 'NEXT_REDIRECT') {
        queryClient.removeQueries({
          queryKey: projectQueryKeys.projectId(projectId),
        });
        queryClient.invalidateQueries({
          queryKey: projectQueryKeys.all,
          exact: false,
        });
        return;
      }
      UINotification.error(error.message);
    },
  });

  return mutation;
}
