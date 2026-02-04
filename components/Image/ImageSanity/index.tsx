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
    
    // Ensure quality and format parameters are set in URL for sharp images
    try {
      const url = new URL(imageSrc);
      // Force high quality
      url.searchParams.set('q', quality.toString());
      // Auto format (webp, etc.) for better compression without quality loss
      url.searchParams.set('auto', 'format');
      // Disable blur/downsampling
      url.searchParams.set('sharp', '10');
      imageSrc = url.toString();
    } catch (e) {
      // Silent error handling
    }
    
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
        imageSrc = url.toString();
      } catch (e) {
        // Silent error handling
      }
    }
    
    // Check for LQIP blur data for loading indicator
    const lqip = asset?.metadata?.lqip;
    const defaultPlaceholder = lqip ? 'blur' : 'empty';
    
    // If we modified the URL for focal point, remove the loader so Next.js uses our custom src
    const modifiedForFocalPoint = isMobile && hotspot && hotspot.x !== undefined && hotspot.y !== undefined;
    if (modifiedForFocalPoint) {
      // When using fill prop, don't include width/height
      if (fill) {
        imageProps = { 
          src: imageSrc, 
          placeholder: defaultPlaceholder
        };
      } else {
        imageProps = { 
          src: imageSrc, 
          width: sanityImage.width,
          height: sanityImage.height,
          placeholder: defaultPlaceholder
        };
      }
    } else {
      // When using fill prop, exclude width and height from sanityImage
      if (fill) {
        const { width, height, ...restSanityImage } = sanityImage;
        imageProps = { ...restSanityImage, src: imageSrc, placeholder: defaultPlaceholder };
      } else {
        imageProps = { ...sanityImage, src: imageSrc, placeholder: defaultPlaceholder };
      }
    }
    
    // Add blur data URL if LQIP exists (lqip already declared above)
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

  // Override with explicit placeholder if provided
  if (placeholder) {
    imageProps.placeholder = placeholder;
  }

  return (
    <NextImage
      key={isMobile ? 'mobile' : 'desktop'}
      className={className}
      quality={quality}
      sizes={sizes}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
      alt={alt}
      fill={fill}
      onError={onError}
      unoptimized={false}
      {...imageProps}
    />
  );
};

export default ImageSanity;
