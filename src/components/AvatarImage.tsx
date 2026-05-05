import React, { useState } from 'react';

const AVATAR_COLORS = [
  ['#3b82f6', '#1d4ed8'], ['#8b5cf6', '#6d28d9'], ['#ec4899', '#be185d'],
  ['#f59e0b', '#b45309'], ['#10b981', '#047857'], ['#ef4444', '#b91c1c'],
  ['#06b6d4', '#0e7490'], ['#f97316', '#c2410c']
];

const getAvatarGradient = (name: string) => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

interface AvatarImageProps {
  src: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

export const AvatarImage: React.FC<AvatarImageProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  onClick
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClass = size === 'lg' ? 'w-20 h-20' : size === 'sm' ? 'w-12 h-12' : 'w-12 h-12';
  const textSizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  
  // Show fallback if no src or image failed to load
  if (!src || hasError) {
    const [from, to] = getAvatarGradient(name);
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center font-bold text-white ${textSizeClass} ${className}`}
        style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        onClick={onClick}
      >
        {getInitials(name)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      className={`${sizeClass} rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
      onClick={onClick}
    />
  );
};
