import { Project } from '@/repositories/projectRepository/project.types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../ui/card';
import { ProjectStatusBadge } from '../ProjectStatusBadge';
import ProjectUpdateCard from '../ProjectUpdateCard';
import { ProjectImages } from './ProjectImages';

interface ProjectPanelProps {
  project: Project;
}

export function ProjectDisplayPanel({ project }: ProjectPanelProps) {
  const { name, description, status, updates } = project;

  return (
    <>
      <Card>
        <CardHeader className='flex justify-between'>
          <CardTitle>{name}</CardTitle>
          <ProjectStatusBadge status={status} />
        </CardHeader>
        <CardDescription className='sr-only'>{`Details of project named: ${name}`}</CardDescription>
        <CardContent>
          <div className='space-y-6'>
            <p className='whitespace-pre-wrap'>{description}</p>
            <ProjectImages canEdit={false} project={project} />
          </div>
        </CardContent>
      </Card>
      {updates?.map((update) => (
        <ProjectUpdateCard
          key={`${name}-update-${update.id}`}
          createdAt={update.created_at}
          update={update.update}
        />
      ))}
    </>
  );
}
