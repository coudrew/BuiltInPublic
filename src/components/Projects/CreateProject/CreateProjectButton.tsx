import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import {
  createProjectSchema,
  CreateProjectSchema,
} from './createProject.schema';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import useUser from '@/hooks/useUser/useUser';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import UINotification from '@/services/UINotification.service';
import { Plus, Loader2 } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProject/useProject';

export function CreateProjectButton({ canEdit = true }: { canEdit?: boolean }) {
  const { data: user, isLoading: isLoadingUser } = useUser();

  const createMutation = useCreateProject();

  const form = useForm<CreateProjectSchema>({
    resolver: zodResolver(createProjectSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
    },
  });

  const submit = async (formData: CreateProjectSchema) => {
    if (!user?.id) {
      UINotification.error('You must be logged in to create a project');
      return;
    }
    
    try {
      await createMutation.mutateAsync(
        { formData, ownerId: user.id, username: user.username || '' }
      );
    } catch (error: any) {
      if (error?.message === 'NEXT_REDIRECT') {
        // Redirect is handled by the server action
        return;
      } else if (error?.message) {
        UINotification.error(error.message);
      } else {
        UINotification.error('Error creating project');
      }
    }
  };

  const onCloseDialog = () => {
    form.reset();
  };

  const disableSubmit =
    !form.formState.isValid ||
    form.formState.isSubmitting ||
    form.formState.isSubmitted ||
    createMutation.isPending;

  const isCreating = form.formState.isSubmitting || createMutation.isPending;

  if (!canEdit) {
    return null;
  }

  if (isLoadingUser) {
    return <Skeleton className='h-8 w-32' />;
  }

  return (
    <Dialog onOpenChange={onCloseDialog}>
      <DialogTrigger asChild>
        <Button className='self-end' disabled={isLoadingUser}>
          Create Project
          <Plus />
        </Button>
      </DialogTrigger>
      <DialogContent className='backdrop-blur-md'>
        <DialogDescription className='sr-only h-0'>
          {'Create a new project'}
        </DialogDescription>
        <Form {...form}>
          <form
            className='flex flex-col gap-3'
            onSubmit={form.handleSubmit(submit)}
          >
            <DialogHeader>
              <DialogTitle>{'Create Project'}</DialogTitle>
            </DialogHeader>
            <div className='space-y-4'>
              <FormField
                control={form.control}
                name={'name'}
                render={({ field }) => (
                  <FormItem className='space-y-2'>
                    <FormLabel>{'Project Name'}</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter project title...' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center gap-3 justify-end pt-4'>
                <Button
                  className='self-end min-w-40'
                  disabled={disableSubmit}
                  type='submit'
                >
                  {isCreating ? (
                    <>
                      <Loader2 className='w-4 h-4 animate-spin mr-2' />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Project
                      <Plus className='w-4 h-4 ml-2' />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
