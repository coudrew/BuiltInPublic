'use client';

import { Avatar } from '@/components/Profile/Avatar';
import useUser from '@/hooks/useUser/useUser';

export default function Profile() {
  const { isLoading, data } = useUser();

  if (isLoading) {
    return <></>;
  }
  return (
    <div className='flex flex-col items-center justify-center text-center max-w-3xl mx-auto px-4 gap-4'>
      {!data?.id ? (
        <h1>profile</h1>
      ) : (
        <Avatar
          currentAvatarUrl={data?.avatarUrl}
          userId={data.id}
          canEdit={true}
        />
      )}

      <h1 className='text-md font-bold justify-items-center'>
        {data?.username}
      </h1>
    </div>
  );
}
