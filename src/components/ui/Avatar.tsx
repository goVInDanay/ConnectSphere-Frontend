<<<<<<< HEAD
import React from 'react';
import { cn, getInitials, buildMediaUrl } from '../../utils';
=======
import React from "react";
import { cn, getInitials } from "../../utils";
>>>>>>> recovery-branch

interface AvatarProps {
  src?: string | null;
  name?: string | null;
<<<<<<< HEAD
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
=======
  size?: "xs" | "sm" | "md" | "lg" | "xl";
>>>>>>> recovery-branch
  className?: string;
  ring?: boolean;
}

const SIZE_CLASSES = {
<<<<<<< HEAD
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

export function Avatar({ src, name, size = 'md', className, ring = false }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-brand-500 to-violet-500',
        SIZE_CLASSES[size],
        ring && 'ring-2 ring-brand-500/40 ring-offset-1 ring-offset-background',
        className
=======
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-base",
  xl: "w-20 h-20 text-xl",
};

export function Avatar({
  src,
  name,
  size = "md",
  className,
  ring = false,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "relative flex-shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-brand-500 to-violet-500",
        SIZE_CLASSES[size],
        ring && "ring-2 ring-brand-500/40 ring-offset-1 ring-offset-background",
        className,
>>>>>>> recovery-branch
      )}
    >
      {src ? (
        <img
<<<<<<< HEAD
          src={buildMediaUrl(src)}
          alt={name ?? 'avatar'}
=======
          src={src}
          alt={name ?? "avatar"}
>>>>>>> recovery-branch
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-bold text-white tracking-tight">
<<<<<<< HEAD
          {getInitials(name, '?')}
=======
          {getInitials(name, "?")}
>>>>>>> recovery-branch
        </span>
      )}
    </div>
  );
}
