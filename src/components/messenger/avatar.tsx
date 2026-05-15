import React from 'react';

const AVATAR_COLORS = [
  ['#3b82f6', '#1d4ed8'],
  ['#8b5cf6', '#6d28d9'],
  ['#ec4899', '#be185d'],
  ['#f59e0b', '#b45309'],
  ['#10b981', '#047857'],
  ['#ef4444', '#b91c1c'],
  ['#06b6d4', '#0e7490'],
  ['#f97316', '#c2410c'],
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

export const AvatarFallback = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const [from, to] = getAvatarGradient(name);
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <div
      className={`w-full h-full flex items-center justify-center font-bold text-white ${sizeClass}`}
      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
    >
      {getInitials(name)}
    </div>
  );
};
