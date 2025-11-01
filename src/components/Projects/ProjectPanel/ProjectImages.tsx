'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImageIcon, Plus, X } from 'lucide-react';
import ImageUploadModal from '@/components/ImageUploadModal';
import Image from 'next/image';
import { useProjectContext } from '@/components/Providers/ProjectProvider';
import UINotification from '@/services/UINotification.service';
import { useEditProject } from '@/hooks/useProject/useProject';
import { Project } from '@/repositories/projectRepository/project.types';

interface ProjectImagesProps {
  canEdit?: boolean;
  project?: Project;
}

const MAX_GALLERY_IMAGES = 4;

const EmptyImagePlaceholder = ({ message, subMessage }: { message: string; subMessage?: string }) => (
  <div className="flex flex-col items-center justify-center text-gray-500">
    <ImageIcon className="w-8 h-8 mb-2" />
    <span className="text-sm font-medium">{message}</span>
    {subMessage && <span className="text-xs">{subMessage}</span>}
  </div>
);

const PrimaryImageDisplay = ({ imageUrl }: { imageUrl?: string | null }) => (
  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900">
    {imageUrl ? (
      <Image
        src={imageUrl}
        alt="Primary project image"
        fill
        className="object-cover"
      />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <EmptyImagePlaceholder message="No image uploaded" />
      </div>
    )}
  </div>
);

export function ProjectImages({ canEdit = false, project }: ProjectImagesProps) {
  if (!canEdit && project) {
    return <ProjectImagesDisplay project={project} />;
  }
  
  return <ProjectImagesEdit />;
}

function ProjectImagesDisplay({ project }: { project: Project }) {
  const { primaryImage, galleryImages } = project;
  const galleryCount = galleryImages?.length || 0;
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">Cover Image</h3>
            <PrimaryImageDisplay imageUrl={primaryImage} />
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-100">
              Gallery Preview ({galleryCount}/{MAX_GALLERY_IMAGES})
            </h3>

            {galleryCount === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-800 p-8">
                <EmptyImagePlaceholder 
                  message="No gallery images" 
                  subMessage={`Add up to ${MAX_GALLERY_IMAGES} images to your gallery`}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages?.map((imageUrl, index) => (
                  <GalleryImageItem 
                    key={`${imageUrl}-${index}`} 
                    imageUrl={imageUrl} 
                    index={index} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const GalleryImageItem = ({ imageUrl, index, onDelete }: { imageUrl: string; index: number; onDelete?: () => void }) => (
  <div className="relative group aspect-video">
    <div className="absolute inset-0 rounded-lg bg-gray-900">
      <Image
        src={imageUrl}
        alt={`Gallery image ${index + 1}`}
        fill
        className="object-cover rounded-lg"
        onError={(e) => {
          const imgElement = e.target as HTMLImageElement;
          imgElement.style.display = 'none';
        }}
        loading="lazy"
      />
    </div>
    {onDelete && (
      <button
        onClick={(e) => {
          e.preventDefault();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Remove image"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </div>
);

function ProjectImagesEdit() {
  const { id, primaryImage, galleryImages, updateProject } = useProjectContext();
  const editMutation = useEditProject();
  const galleryCount = galleryImages?.length || 0;
  const canAddMore = galleryCount < MAX_GALLERY_IMAGES;

  const handlePrimaryImageSelect = async (imageUrl: string) => {
    try {
      await updateProject({ primaryImage: imageUrl });
      
      editMutation.mutate(
        { projectId: id, data: { primaryImage: imageUrl } as any },
        {
          onError: (error) => {
            UINotification.error('Failed to update primary image');
            console.error('Failed to update primary image:', error);
          },
        }
      );
    } catch (error) {
      UINotification.error('Failed to update primary image');
      console.error('Failed to update primary image:', error);
    }
  };

  const handleGalleryImagesSelect = async (imageUrls: string[]) => {
    try {
      if (galleryCount + imageUrls.length > MAX_GALLERY_IMAGES) {
        UINotification.error(`Maximum ${MAX_GALLERY_IMAGES} gallery images allowed`);
        return;
      }

      const updatedGallery = [...(galleryImages || []), ...imageUrls];
      await updateProject({ galleryImages: updatedGallery });
      
      editMutation.mutate(
        { projectId: id, data: { galleryImages: updatedGallery } as any },
        {
          onError: (error) => {
            UINotification.error('Failed to update gallery images');
            console.error('Failed to update gallery images:', error);
          },
        }
      );
    } catch (error) {
      UINotification.error('Failed to update gallery images');
      console.error('Failed to update gallery images:', error);
    }
  };

  const handleDeleteGalleryImage = async (imageUrl: string) => {
    try {
      const updatedGallery = galleryImages?.filter((img: string) => img !== imageUrl) || [];
      await updateProject({ galleryImages: updatedGallery });
      
      editMutation.mutate(
        { projectId: id, data: { galleryImages: updatedGallery } as any },
        {
          onError: (error) => {
            UINotification.error('Failed to remove image from gallery');
            console.error('Failed to remove gallery image:', error);
          },
        }
      );
    } catch (error) {
      UINotification.error('Failed to remove image from gallery');
      console.error('Failed to remove gallery image:', error);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">Cover Image</h3>
              <ImageUploadModal
                onSelectSingleImage={handlePrimaryImageSelect}
                singleImageMode
              >
                <Button variant="outline" size="sm">
                  {primaryImage ? 'Change Image' : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Image
                    </>
                  )}
                </Button>
              </ImageUploadModal>
            </div>
            <PrimaryImageDisplay imageUrl={primaryImage} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-100">
                Gallery Preview ({galleryCount}/{MAX_GALLERY_IMAGES})
              </h3>
              {canAddMore && (
                <ImageUploadModal
                  onSelectMultipleImages={handleGalleryImagesSelect}
                  initialSelectedImages={galleryImages || []}
                >
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Images
                  </Button>
                </ImageUploadModal>
              )}
            </div>

            {galleryCount === 0 ? (
              <div className="rounded-lg border-2 border-dashed border-gray-800 p-8">
                <EmptyImagePlaceholder 
                  message="No gallery images" 
                  subMessage={`Add up to ${MAX_GALLERY_IMAGES} images to your gallery`}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {galleryImages?.map((imageUrl: string, index: number) => (
                  <GalleryImageItem
                    key={`${imageUrl}-${index}`}
                    imageUrl={imageUrl}
                    index={index}
                    onDelete={() => handleDeleteGalleryImage(imageUrl)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}