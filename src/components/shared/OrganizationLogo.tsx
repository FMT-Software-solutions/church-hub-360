import React from 'react';
import { cn } from '@/lib/utils';
import type {
  LogoBackgroundSize,
  LogoOrientation,
} from '@/types/organizations';

export interface OrganizationLogoProps {
  src?: string | null;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  orientation?: LogoOrientation;
  backgroundSize?: LogoBackgroundSize;
  className?: string;
  onClick?: () => void;
}

const sizeMap = {
  xs: 24, // 1.5rem
  sm: 32, // 2rem
  md: 48, // 3rem
  lg: 64, // 4rem
  xl: 80, // 5rem
  '2xl': 96, // 6rem
};

const getSizeValue = (size: OrganizationLogoProps['size']): number => {
  if (typeof size === 'number') return size;
  return sizeMap[size || 'md'] || sizeMap.md;
};

const getAspectRatio = (orientation?: LogoOrientation): string => {
  switch (orientation) {
    case 'portrait':
      return 'aspect-[3/4]';
    case 'landscape':
      return 'aspect-[4/3]';
    case 'square':
    default:
      return 'aspect-square';
  }
};

export function OrganizationLogo({
  src,
  fallback = 'Logo',
  size = 'md',
  orientation = 'square',
  backgroundSize = 'contain',
  className,
  onClick,
}: OrganizationLogoProps) {
  const sizeValue = getSizeValue(size);
  const aspectRatio = getAspectRatio(orientation);

  // Map custom values to CSS-compatible values
  let bgSizeValue: string;
  switch (backgroundSize) {
    case 'fill':
      bgSizeValue = '100% 100%'; // Stretch to fill
      break;
    default:
      bgSizeValue = backgroundSize; // cover and contain work as-is
  }

  const bgStyles: React.CSSProperties = {
    backgroundImage: src ? `url(${src})` : 'none',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: bgSizeValue,
    width: `${sizeValue}px`,
    height:
      orientation === 'square'
        ? `${sizeValue}px`
        : orientation === 'portrait'
        ? `${Math.round(sizeValue * (4 / 3))}px`
        : `${Math.round(sizeValue * (3 / 4))}px`,
  };

  return (
    <div
      className={cn(
        'bg-muted/50 relative overflow-hidden rounded-md flex items-center justify-center',
        aspectRatio,
        className
      )}
      style={bgStyles}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {!src && (
        <div className="text-muted-foreground font-medium text-center">
          {fallback}
        </div>
      )}
    </div>
  );
}
