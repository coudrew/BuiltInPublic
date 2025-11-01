'use client';

import {
  useQuery,
  useMutation,
  UseMutationResult,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
import {
  uploadImage,
  deleteImage,
  getUserImages,
  updateImageAltText,
  ImageData,
  UploadImageInput,
} from './actions';
import UINotification from '@/services/UINotification.service';
import { ValidationError } from 'utils/errors/ValidationError';

const imageQueryKeys = {
  all: ['images'] as const,
  user: () => [...imageQueryKeys.all, 'user'] as const,
  detail: (imageId: string) => [...imageQueryKeys.all, imageId] as const,
};

/**
 * Hook to fetch all images for the current user
 */
export function useUserImages(): UseQueryResult<ImageData[], Error> {
  const { data, isLoading, error } = useQuery({
    queryKey: imageQueryKeys.user(),
    queryFn: async () => {
      const result = await getUserImages();
      if (!result.success) {
        throw new Error(result.message);
      }
      return result.images || [];
    },
  });

  if (error) {
    UINotification.error('Error fetching images');
  }

  return { data, isLoading, error } as UseQueryResult<ImageData[], Error>;
}

/**
 * Hook to upload an image
 * Takes the processed image data from the component
 */
export const useUploadImage = (): UseMutationResult<
  { success: boolean; imageId?: string; publicUrl?: string; message: string },
  Error,
  UploadImageInput
> => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (input: UploadImageInput) => uploadImage(input),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageQueryKeys.all });
        UINotification.success(result.message);
      } else {
        UINotification.error(result.message);
      }
    },
    onError: (error: Error) => {
      if (error instanceof ValidationError) {
        // Let onSettled handle validation errors
        return;
      }
      UINotification.error('Error uploading image');
    },
  });

  return mutation;
};

/**
 * Hook to delete an image
 */
export const useDeleteImage = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  string
> => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (imageId: string) => deleteImage(imageId),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageQueryKeys.all });
        UINotification.success(result.message);
      } else {
        UINotification.error(result.message);
      }
    },
    onError: (error: Error) => {
      UINotification.error('Error deleting image');
    },
  });

  return mutation;
};

/**
 * Hook to update image alt text
 */
export const useUpdateImageAltText = (): UseMutationResult<
  { success: boolean; message: string },
  Error,
  { imageId: string; altText?: string }
> => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: { imageId: string; altText?: string }) =>
      updateImageAltText(data),
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: imageQueryKeys.all });
        UINotification.success(result.message);
      } else {
        UINotification.error(result.message);
      }
    },
    onError: (error: Error) => {
      if (error instanceof ValidationError) {
        // Let onSettled handle validation errors
        return;
      }
      UINotification.error('Error updating alt text');
    },
  });

  return mutation;
};