// src/components/dashboard/SelfieImageDisplay.tsx
'use client';

import NextImage, { type ImageProps } from 'next/image';
import { useState } from 'react';

interface SelfieImageDisplayProps extends Omit<ImageProps, 'onError' | 'src'> {
  src: string | null | undefined;
  alt: string;
  fallbackSrc?: string;
  dataAiHint?: string;
}

export default function SelfieImageDisplay({
  src,
  alt,
  fallbackSrc = 'https://placehold.co/150x150/CCCCCC/777777.png?text=Error',
  dataAiHint,
  ...props
}: SelfieImageDisplayProps) {
  const [imageError, setImageError] = useState(false);

  // Determine the source to use: original, fallback, or if src itself is null/undefined
  const effectiveSrc = imageError || !src ? fallbackSrc : src;

  return (
    <NextImage
      src={effectiveSrc}
      alt={alt}
      onError={() => {
        if (!imageError && src !== fallbackSrc) { // Prevent infinite loops if fallback also fails or if src was already fallback
          setImageError(true);
        }
      }}
      data-ai-hint={imageError ? 'image error' : (dataAiHint || 'selfie image')}
      {...props}
    />
  );
}
