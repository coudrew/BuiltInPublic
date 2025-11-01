'use client';
import Image from 'next/image';

interface ProfileIconProps {
  url?: string | null;
  className?: string;
}

export default function ProfileIcon({ url, className = '' }: ProfileIconProps) {
  return (
    <div className='relative w-full h-full overflow-hidden'>
      <Image
        src={url || '/default-avatar.png'}
        alt='User profile'
        fill
        sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        priority
        className={`rounded-full object-cover ${className}`}
      />
    </div>
  );
}
