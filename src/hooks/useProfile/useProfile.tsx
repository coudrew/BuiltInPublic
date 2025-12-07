'use client';

import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
} from '@tanstack/react-query';
import { getProfileByUsername, updateProfile } from './actions';
import UINotification from '@/services/UINotification.service';
import { UserProfileUpdateData } from '@/use-cases/updateUserProfile/UpdateUserProfile';
import { ValidationError } from 'utils/errors/ValidationError';

const profileQueryKeys = {
  all: ['profile'] as const,
  username: (profileUserame: string) =>
    [...profileQueryKeys.all, profileUserame] as const,
};

export default function useProfile(username: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: profileQueryKeys.username(username),
    queryFn: () => getProfileByUsername(username),
    enabled: Boolean(username),
  });

  if (error) {
    UINotification.error('Error fetching profile');
  }

  return { data, isLoading, error };
}

const useUpdateProfile = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  UserProfileUpdateData,
  unknown
> => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: profileQueryKeys.all });
      if (data.success) {
        UINotification.success(data.message || 'Profile updated successfully');
      }
    },
    onError: (error) => {
      if (error instanceof ValidationError) {
        const validationErrors = Object.values(error.validationErrors)
          .flat()
          .join(', ');
        UINotification.error(validationErrors);
      } else {
        UINotification.error(error.message || 'Failed to update profile');
      }
    },
  });
};

export { useUpdateProfile };
