import { Skeleton } from '@/components/ui/skeleton';
import DisplayName from '@/components/Profile/DisplayName';
import Bio from '@/components/Profile/Bio';
import SignOutBtn from '@/components/Buttons/SignOutBtn';
import 'react-toastify/dist/ReactToastify.css';
import { useProfileContext } from '@/components/Providers/ProfileProvider';
import { Avatar } from '@/components/Profile/Avatar';

export default function UserInfo() {
  const { isLoading, profile, canEdit } = useProfileContext();

  return (
    <section className='flex flex-col gap-4 relative w-full col-span-4 xl:col-span-1'>
      {isLoading ? (
        <Skeleton className='w-24 h-24 rounded-full' />
      ) : (
        <Avatar
          currentAvatarUrl={profile.avatarUrl}
          userId={profile.id}
          canEdit={canEdit}
        />
      )}

      <DisplayName />
      <Bio />
      <SignOutBtn />
    </section>
  );
}
