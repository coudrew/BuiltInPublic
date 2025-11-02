// components/ProjectCard.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ProjectStatusBadge } from './ProjectStatusBadge';
import { truncateText } from '@/lib/utils';
import type { Project } from '@/repositories/projectRepository/project.types';

interface ProjectCardProps extends Partial<Project> {
  href: string;
}

export default function ProjectCard({
  name,
  description = '',
  status = 'planning',
  primaryImage,
  href,
}: ProjectCardProps) {
  return (
    <Link
      href={href}
      className='block focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-2xl'
      aria-label={`Open project: ${name}`}
    >
      <Card className='w-full rounded-2xl shadow-sm backdrop-blur-2xl hover:shadow cursor-pointer overflow-hidden'>
        <div className='flex flex-row gap-4 p-4'>
          {/* Image on the left */}
          <div className='relative w-32 h-32 shrink-0 rounded-lg overflow-hidden bg-gray-900'>
            {primaryImage ? (
              <Image
                src={primaryImage}
                alt={name || 'Project image'}
                fill
                className='object-cover'
                sizes='128px'
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-linear-to-br from-purple-500/20 to-blue-500/20'>
                <svg
                  className='w-12 h-12 text-purple-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Content on the right */}
          <div className='flex-1 flex flex-col gap-2 min-w-0'>
            <div className='flex flex-row items-start justify-between gap-3'>
              <CardTitle className='text-lg font-semibold text-slate-100 font-subheading'>
                {name}
              </CardTitle>
              <ProjectStatusBadge status={status} />
            </div>

            {description && (
              <p className='text-sm leading-6 text-slate-300 font-body'>
                {truncateText(description, 140)}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
