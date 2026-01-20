'use client';

import NextImage, { ImageProps } from 'next/image';
import { useNextSanityImage } from 'next-sanity-image';
import { client as sanityClient } from '@/tools/sanity/lib/client';

type ImageSanityProps = {
  asset: any;
  crop?: any;
  hotspot?: any;
  className?: string;
  sizes?: string;
  alt: string;
  quality: number;
  onError: (e: any) => void;
  error: boolean;
  fill: boolean;
  fallback: {
    src: string;
    height: number;
    width: number;
    blurDataURL?: string;
  };
  priority: boolean;
  placeholder?: 'blur' | 'empty';
};

const ImageSanity: React.FC<ImageSanityProps> = props => {
  const { asset, crop, hotspot, sizes, className, quality, alt, fill, placeholder, onError, priority, error, fallback } = props;

  let imageProps: Partial<ImageProps> = {};

  // Create the full image object with crop and hotspot for useNextSanityImage
  const imageObject = crop || hotspot ? { asset, crop, hotspot } : asset;
  
  const sanityImage: any = useNextSanityImage(sanityClient, imageObject);

  if (sanityImage && sanityImage?.src && !error) {
    imageProps = { ...sanityImage, placeholder: 'empty' };
    const lqip = asset?.metadata?.lqip;
    if (lqip) {
      imageProps.blurDataURL = lqip;
      imageProps.placeholder = 'blur';
    }
  } else {
    imageProps = {
      ...fallback,
      placeholder: fallback.blurDataURL ? 'blur' : 'empty'
    };
  }

  if (placeholder) imageProps.placeholder = placeholder;

  return (
    <NextImage
      className={className}
      quality={quality}
      sizes={sizes}
      priority={priority}
      alt={alt}
      fill={fill}
      onError={onError}
      {...imageProps}
    />
  );
};

export default ImageSanity;
