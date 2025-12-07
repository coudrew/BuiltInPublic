'use client';

import React from 'react';
import { useUpdateProfile } from '@/hooks/useProfile/useProfile';
import ProfileIcon from '@/components/ProfileIcon';
import ImageUploadModal from '@/components/ImageUploadModal';

interface AvatarProps {
  currentAvatarUrl?: string | null;
  userId: string;
  canEdit?: boolean;
}

export function Avatar({
  currentAvatarUrl,
  userId,
  canEdit = false,
}: AvatarProps) {
  const updateProfileMutation = useUpdateProfile();

  const handleAvatarUpdate = (imageUrl: string) => {
    updateProfileMutation.mutate({
      id: userId,
      avatar_url: imageUrl,
    });
  };

  // If user cannot edit, just show the avatar without edit functionality
  if (!canEdit) {
    return (
      <div className='relative'>
        <div className='w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500/30'>
          <ProfileIcon url={currentAvatarUrl} className='w-full h-full' />
        </div>
      </div>
    );
  }

  // If user can edit, show with hover effect and modal
  return (
    <div className='relative group'>
      <div className='cursor-pointer'>
        <ImageUploadModal
          singleImageMode={true}
          onSelectSingleImage={handleAvatarUpdate}
          initialSelectedImages={currentAvatarUrl ? [currentAvatarUrl] : []}
        >
          <div className='relative w-32 h-32 rounded-full overflow-hidden border-2 border-purple-500/30'>
            <ProfileIcon url={currentAvatarUrl} className='w-full h-full' />
            <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-br from-purple-600/80 to-blue-600/80 backdrop-blur-sm'>
              <span className='text-white text-sm font-medium'>
                Change Avatar
              </span>
            </div>
          </div>
        </ImageUploadModal>
      </div>
    </div>
  );
}
