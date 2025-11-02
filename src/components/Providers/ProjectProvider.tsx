import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import {
  Project,
  ProjectStatus,
  ProjectVisibility,
} from '@/repositories/projectRepository/project.types';

interface ProjectContextValue extends Project {
  updateProject: (fields: ProjectUpdateFields) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(
  undefined
);

interface ProjectProviderProps {
  project: Project;
  children: ReactNode;
}

interface ProjectUpdateFields {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  visibility?: ProjectVisibility;
  primaryImage?: string;
  galleryImages?: string[];
}

export function ProjectProvider({
  project: initialProject,
  children,
}: ProjectProviderProps) {
  const [project, setProject] = React.useState(initialProject);

  useEffect(() => {
    setProject(initialProject);
  }, [initialProject]);

  const updateProject = async (fields: ProjectUpdateFields) => {
    setProject((prev) => ({ ...prev, ...fields }));
  };

  const contextValue = {
    ...project,
    updateProject,
  };

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjectContext() {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProjectContext must be used within a ProjectProvider');
  }
  return context;
}
