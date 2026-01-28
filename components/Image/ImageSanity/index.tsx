'use client';

import NextImage, { ImageProps } from 'next/image';
import { useNextSanityImage } from 'next-sanity-image';
import { client as sanityClient } from '@/tools/sanity/lib/client';
import { useState, useEffect, useMemo } from 'react';

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

  const [isMobile, setIsMobile] = useState(true); // Start with true to show hotspot

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);
    };
    
    // Check on mount
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Always apply crop (rectangle), but only apply hotspot (circle) on mobile
  const imageObject = useMemo(() => {
    return isMobile 
      ? { asset, crop, hotspot }  // Mobile: Use both crop and hotspot
      : crop 
        ? { asset, crop }  // Desktop: Only use crop (rectangle), ignore hotspot (circle)
        : asset;  // No crop or hotspot
  }, [isMobile, asset, crop, hotspot]);
  
  const sanityImage: any = useNextSanityImage(sanityClient, imageObject);

  let imageProps: any = {};

  if (sanityImage && sanityImage?.src && !error) {
    let imageSrc = sanityImage.src;
    
    // Manually add focal point parameters on mobile if hotspot exists
    if (isMobile && hotspot && hotspot.x !== undefined && hotspot.y !== undefined) {
      try {
        const url = new URL(imageSrc);
        // Remove existing fit and crop parameters
        url.searchParams.delete('fit');
        url.searchParams.delete('crop');
        // Add focal point parameters with dimensions
        url.searchParams.set('w', '800');
        url.searchParams.set('h', '1200');
        url.searchParams.set('fit', 'crop');
        url.searchParams.set('crop', 'focalpoint');
        url.searchParams.set('fp-x', hotspot.x.toString());
        url.searchParams.set('fp-y', hotspot.y.toString());
        // Add cache buster to force fresh image
        url.searchParams.set('v', Date.now().toString());
        imageSrc = url.toString();
      } catch (e) {
        // Silent error handling
      }
    }
    
    // If we modified the URL for focal point, remove the loader so Next.js uses our custom src
    const modifiedForFocalPoint = isMobile && hotspot && hotspot.x !== undefined && hotspot.y !== undefined;
    if (modifiedForFocalPoint) {
      // When using fill prop, don't include width/height
      if (fill) {
        imageProps = { 
          src: imageSrc, 
          placeholder: 'empty'
        };
      } else {
        imageProps = { 
          src: imageSrc, 
          width: sanityImage.width,
          height: sanityImage.height,
          placeholder: 'empty'
        };
      }
    } else {
      // When using fill prop, exclude width and height from sanityImage
      if (fill) {
        const { width, height, ...restSanityImage } = sanityImage;
        imageProps = { ...restSanityImage, src: imageSrc, placeholder: 'empty' };
      } else {
        imageProps = { ...sanityImage, src: imageSrc, placeholder: 'empty' };
      }
    }
    
    const lqip = asset?.metadata?.lqip;
    if (lqip) {
      imageProps.blurDataURL = lqip;
      imageProps.placeholder = 'blur';
    }
  } else {
    // When using fill prop, exclude width and height from fallback
    if (fill) {
      const { width, height, ...restFallback } = fallback;
      imageProps = {
        ...restFallback,
        placeholder: fallback.blurDataURL ? 'blur' : 'empty'
      };
    } else {
      imageProps = {
        ...fallback,
        placeholder: fallback.blurDataURL ? 'blur' : 'empty'
      };
    }
  }

  if (placeholder) imageProps.placeholder = placeholder;

  return (
    <NextImage
      key={isMobile ? 'mobile' : 'desktop'}
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
