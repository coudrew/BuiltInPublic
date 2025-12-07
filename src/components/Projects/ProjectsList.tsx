'use client';

import { useState, useCallback, useMemo } from 'react';
import { useProjectsWithPagination } from '@/hooks/useProject/useProject';
import { Skeleton } from '../ui/skeleton';
import ProjectCard from './ProjectCard';
import { useProfileContext } from '@/components/Providers/ProfileProvider';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PROJECTS_PER_PAGE = 6;
const MAX_VISIBLE_PAGES = 7;

export function ProjectsList() {
  const { profile, canEdit } = useProfileContext();
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading } = useProjectsWithPagination(
    profile?.username || '',
    currentPage,
    PROJECTS_PER_PAGE
  );

  const totalPages = useMemo(
    () => (data ? Math.ceil(data.totalCount / PROJECTS_PER_PAGE) : 0),
    [data]
  );

  const showPagination = totalPages > 1;
  const projects = data?.projects || [];

  const handlePreviousPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const handlePageClick = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];

    if (totalPages <= MAX_VISIBLE_PAGES) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          'ellipsis',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          'ellipsis',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          'ellipsis',
          totalPages
        );
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  if (isLoading) {
    return <Skeleton className='h-64 w-full' />;
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-4'>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            name={project.name}
            description={project.description}
            status={project.status}
            primaryImage={project.primaryImage}
            href={
              canEdit
                ? `/${profile.username}/project/${project.id}`
                : `/project/${project.id}`
            }
          />
        ))}
      </div>

      {showPagination && (
        <Pagination className='mt-4'>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }
              />
            </PaginationItem>

            {getPageNumbers().map((page, index) => (
              <PaginationItem key={index}>
                {page === 'ellipsis' ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => handlePageClick(page as number)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={
                  currentPage === totalPages
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
