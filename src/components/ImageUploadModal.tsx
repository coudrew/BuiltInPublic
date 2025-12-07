'use client';

import { useState, useEffect, type MouseEvent, type ReactNode } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  useUserImages,
  useUploadImage,
  useDeleteImage,
} from '@/hooks/useImage/useImage';
import { Loader2, X } from 'lucide-react';
import {
  convertToWebP,
  validateFileType,
  validateFileSize,
  createPreviewURL,
  revokePreviewURL,
} from '@/lib/imageUtils';
import UINotification from '@/services/UINotification.service';

interface FileWithPreview {
  file: File;
  preview: string;
}

interface ImageUploadModalProps {
  onSelectMultipleImages?: (imageUrls: string[]) => void;
  onSelectSingleImage?: (imageUrl: string) => void;
  initialSelectedImages?: string[];
  singleImageMode?: boolean;
  children: ReactNode;
}

export default function ImageUploadModal({
  onSelectMultipleImages,
  onSelectSingleImage,
  initialSelectedImages = [],
  singleImageMode = false,
  children,
}: ImageUploadModalProps) {
  const { data: images, isLoading } = useUserImages();
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
    []
  );
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const uploadMutation = useUploadImage();
  const deleteMutation = useDeleteImage();

  useEffect(() => {
    return () => {
      selectedFiles.forEach((file) => {
        revokePreviewURL(file.preview);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileSelect = async (files: File[]) => {
    const newFiles: FileWithPreview[] = [];
    const errors: string[] = [];

    for (const file of files) {
      if (!validateFileType(file)) {
        errors.push(
          `${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`
        );
        continue;
      }

      if (!validateFileSize(file)) {
        errors.push(`${file.name}: File too large. Maximum size is 10MB.`);
        continue;
      }

      newFiles.push({
        file,
        preview: createPreviewURL(file),
      });
    }

    if (errors.length > 0) {
      UINotification.error(errors.join('\n'));
    }

    if (newFiles.length > 0) {
      if (singleImageMode) {
        setSelectedFiles([newFiles[0]]);
        setSelectedGalleryImages([]);
      } else {
        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      const uploadedImageUrls: string[] = [];

      for (const { file } of selectedFiles) {
        const { file: webpFile, width, height } = await convertToWebP(file);

        const result = await uploadMutation.mutateAsync({
          file: webpFile,
          originalFilename: file.name,
          altText: '',
          width,
          height,
        });

        if (result.success && result.publicUrl) {
          uploadedImageUrls.push(result.publicUrl);
        }
      }

      if (uploadedImageUrls.length > 0) {
        if (singleImageMode) {
          onSelectSingleImage?.(uploadedImageUrls[0]);
        } else {
          onSelectMultipleImages?.(uploadedImageUrls);
        }
      }

      selectedFiles.forEach((file) => revokePreviewURL(file.preview));
      setSelectedFiles([]);
      closeDialog();
    } catch (error) {
      console.error('Upload failed:', error);
      UINotification.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (imageId: string, e: MouseEvent) => {
    e.stopPropagation();

    try {
      await deleteMutation.mutateAsync(imageId);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setSelectedFiles([]);
    setSelectedGalleryImages([]);
  };

  useEffect(() => {
    if (dialogOpen) {
      setSelectedGalleryImages([]);
      setSelectedFiles([]);
    }
  }, [dialogOpen]);

  const handleComplete = () => {
    if (selectedGalleryImages.length > 0) {
      if (singleImageMode) {
        onSelectSingleImage?.(selectedGalleryImages[0]);
      } else {
        onSelectMultipleImages?.(selectedGalleryImages);
      }
      closeDialog();
    } else if (selectedFiles.length > 0) {
      handleUpload();
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[90vh] w-full bg-[#0A0A29] text-white overflow-hidden flex flex-col'>
        <DialogHeader className='shrink-0'>
          <DialogTitle className='text-2xl'>Upload Image</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className='flex-1 overflow-y-auto overflow-x-hidden pr-2'>
          {/* File Upload Area */}
          <div
            className='mt-4 border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors'
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <div className='flex flex-col items-center'>
              <div className='w-16 h-16 mb-4'>
                <svg
                  viewBox='0 0 24 24'
                  fill='none'
                  stroke='currentColor'
                  className='w-full h-full text-gray-400'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <p className='text-lg font-medium mb-2'>
                Drop images here or click to browse
              </p>
              <p className='text-sm text-gray-400'>
                Supported: JPEG, PNG, WebP (Max 10MB)
              </p>
              <input
                id='file-input'
                type='file'
                accept='image/jpeg,image/jpg,image/png,image/webp'
                multiple={!singleImageMode}
                className='hidden'
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    handleFileSelect(files);
                  }
                  e.target.value = '';
                }}
              />
            </div>
          </div>

          {selectedFiles.length > 0 && (
            <div className='mt-4'>
              <h3 className='text-lg font-medium mb-2'>
                Selected Files ({selectedFiles.length})
              </h3>
              <div className='grid grid-cols-4 gap-2'>
                {selectedFiles.map((file, index) => (
                  <div key={index} className='relative group'>
                    <div className='relative aspect-square'>
                      <Image
                        src={file.preview}
                        alt={`Preview ${index + 1}`}
                        className='w-full h-full object-cover rounded-lg'
                        width={100}
                        height={100}
                      />
                    </div>
                    <button
                      type='button'
                      className='absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                      onClick={() => {
                        revokePreviewURL(file.preview);
                        setSelectedFiles((prev) =>
                          prev.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <X className='h-4 w-4' />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className='mt-6'>
            <h3 className='text-lg font-medium mb-4'>Choose From Gallery</h3>

            {isLoading && (
              <div className='flex items-center justify-center h-20 gap-2'>
                <Loader2 className='w-4 h-4 animate-spin' />
                <span className='text-sm text-gray-400'>
                  Loading gallery...
                </span>
              </div>
            )}

            {!isLoading && (!images || images.length === 0) && (
              <p className='text-sm text-gray-400 text-center py-8'>
                No saved images yet.
              </p>
            )}

            {!isLoading && images && images.length > 0 && (
              <div className='grid grid-cols-4 gap-2 mt-2'>
                {images.map((img) => {
                  const isSelected = selectedGalleryImages.includes(
                    img.publicUrl
                  );
                  const isAlreadySelected = initialSelectedImages.includes(
                    img.publicUrl
                  );

                  return (
                    <button
                      key={img.id}
                      type='button'
                      onClick={() => {
                        if (isAlreadySelected) {
                          return;
                        }

                        if (singleImageMode) {
                          // In single mode, replace selection
                          setSelectedGalleryImages([img.publicUrl]);
                          // Clear file selection
                          setSelectedFiles([]);
                        } else {
                          // In multi mode, toggle selection
                          if (isSelected) {
                            setSelectedGalleryImages((prev) =>
                              prev.filter((url) => url !== img.publicUrl)
                            );
                          } else {
                            setSelectedGalleryImages((prev) => [
                              ...prev,
                              img.publicUrl,
                            ]);
                          }
                        }
                      }}
                      className={`relative aspect-square group transition-all ${
                        isSelected
                          ? 'ring-2 ring-blue-500'
                          : 'hover:ring-2 hover:ring-blue-500'
                      } ${isAlreadySelected ? 'opacity-50 cursor-not-allowed' : ''} rounded-lg overflow-hidden`}
                      disabled={isAlreadySelected}
                    >
                      {!isAlreadySelected && (
                        <button
                          type='button'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteImage(img.id, e);
                          }}
                          disabled={deleteMutation.isPending}
                          aria-label='Delete image'
                          className='absolute top-1 right-1 z-10 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className='h-3 w-3 animate-spin' />
                          ) : (
                            <X className='h-3 w-3' />
                          )}
                        </button>
                      )}
                      <Image
                        src={img.publicUrl}
                        alt={img.originalFilename || 'Gallery image'}
                        fill
                        sizes='(max-width: 768px) 25vw, 20vw'
                        className={`object-cover transition-opacity ${
                          isSelected ? 'opacity-75' : 'group-hover:opacity-75'
                        }`}
                      />
                      {isSelected && (
                        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-25'>
                          <div className='bg-blue-500 rounded-full p-1'>
                            <svg
                              width='16'
                              height='16'
                              viewBox='0 0 16 16'
                              fill='none'
                              xmlns='http://www.w3.org/2000/svg'
                            >
                              <path
                                d='M13.3332 4L5.99984 11.3333L2.6665 8'
                                stroke='white'
                                strokeWidth='2'
                                strokeLinecap='round'
                                strokeLinejoin='round'
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      {isAlreadySelected && (
                        <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-50'>
                          <span className='text-white text-xs font-medium'>
                            Already Selected
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className='mt-4 shrink-0 flex gap-2'>
          <Button
            type='button'
            variant='ghost'
            onClick={closeDialog}
            className='w-full sm:w-auto'
          >
            Cancel
          </Button>

          {(selectedFiles.length > 0 || selectedGalleryImages.length > 0) && (
            <Button
              type='button'
              onClick={handleComplete}
              className='w-full sm:w-auto bg-blue-600 hover:bg-blue-700'
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className='w-4 h-4 animate-spin mr-2' />
                  Uploading...
                </>
              ) : (
                <>
                  Select {selectedGalleryImages.length || selectedFiles.length}{' '}
                  {(selectedGalleryImages.length || selectedFiles.length) === 1
                    ? 'Image'
                    : 'Images'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
