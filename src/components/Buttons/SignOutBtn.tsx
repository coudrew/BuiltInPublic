import useUser from '@/hooks/useUser/useUser';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LogOut } from 'lucide-react';

export default function SignOutBtn() {
  const { signOutUser, data, isLoading } = useUser();

  if (isLoading) {
    return <Skeleton className='h-8 w-28' />;
  }

  if (!data?.id) {
    return null;
  }

  return (
    <Button
      onClick={signOutUser}
      variant={'destructive'}
      type='button'
      title='Sign Out'
      aria-label='Sign Out'
    >
      Sign Out
      <LogOut />
    </Button>
  );
}
