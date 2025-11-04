import { useState, useEffect } from 'react';

interface BlobPosition {
  x: number;
  y: number;
  size: number;
}

const GradientBlobs = () => {
  const [blobPositions, setBlobPositions] = useState<BlobPosition[]>([]);

  const numBlobs = 8;

  const gradientCombinations = [
    'from-purple-600 to-pink-600',
    'from-blue-600 to-cyan-600',
    'from-green-600 to-emerald-600',
    'from-orange-600 to-red-600',
    'from-indigo-600 to-purple-600',
    'from-pink-600 to-rose-600',
    'from-cyan-600 to-blue-600',
    'from-emerald-600 to-teal-600',
  ];

  const getGradientClass = (index: number): string => {
    const safeIndex = Math.abs(index) % gradientCombinations.length;
    return (
      gradientCombinations.at(safeIndex) ??
      gradientCombinations.at(0) ??
      'from-purple-600 to-pink-600'
    );
  };

  useEffect(() => {
    const maxWidth = window.innerWidth * 0.7;
    const maxHeight = window.innerHeight * 0.5;
    
    const positions = Array.from({ length: numBlobs }, () => ({
      x: Math.random() * maxWidth,
      y: Math.random() * maxHeight,
      size: Math.random() * 100 + 250,
    }));
    setBlobPositions(positions);
  }, []);

  return (
    <>
      {blobPositions.map((position, index) => {
        const gradientClass = getGradientClass(index);
        return (
          <div
            key={index}
            className={`bg-linear-to-r ${gradientClass} rounded-full blur-[100px] absolute -z-10 opacity-20 transition-all duration-1000 pointer-events-none`}
            style={
              {
                '--blob-x': `${position.x}px`,
                '--blob-y': `${position.y}px`,
                '--blob-size': `${position.size}px`,
                transform: 'translate(var(--blob-x), var(--blob-y))',
                width: 'var(--blob-size)',
                height: 'var(--blob-size)',
                maxWidth: '100%',
                maxHeight: '100vh',
              } as React.CSSProperties
            }
          />
        );
      })}
    </>
  );
};

export default GradientBlobs;
