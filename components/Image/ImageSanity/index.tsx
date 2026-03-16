'use client';

import NextImage from 'next/image';
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
    smallImage?: boolean;
  priority: boolean;
  placeholder?: 'blur' | 'empty';
  disableHotspotCrop?: boolean;
};

const ImageSanity: React.FC<ImageSanityProps> = props => {
  const {
    asset,
    crop,
    hotspot,
    sizes,
    className,
    quality,
    alt,
    fill,
    placeholder,
    onError,
    priority,
    error,
    fallback,
    smallImage = false,
    disableHotspotCrop = false
  } = props;

  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const imageObject = useMemo(() => {
    return isMobile
      ? { asset, crop, hotspot }
      : crop
      ? { asset, crop }
      : asset;
  }, [isMobile, asset, crop, hotspot]);

  const sanityImage: any = useNextSanityImage(sanityClient, imageObject);

  let imageProps: any = {};

  if (sanityImage && sanityImage?.src && !error) {
    let imageSrc = sanityImage.src;

  try {
  const url = new URL(imageSrc);

  // Base params
  url.searchParams.set('q', quality.toString());
  url.searchParams.set('auto', 'format');
  url.searchParams.set('sharp', '10');
  url.searchParams.set('dpr', '2');

  // Apply params for small images (explicit flag) with hotspot support
  if (smallImage) {
    url.searchParams.set('w', '800');
    url.searchParams.set('h', '800');
    url.searchParams.set('fit', 'crop');
    
    if (hotspot && hotspot.x !== undefined && hotspot.y !== undefined && !disableHotspotCrop) {
      url.searchParams.set('crop', 'focalpoint');
      url.searchParams.set('fp-x', hotspot.x.toString());
      url.searchParams.set('fp-y', hotspot.y.toString());
    }
  }
  // Mobile focal point logic (only if smallImage is not active)
  else if (
    isMobile &&
    hotspot &&
    hotspot.x !== undefined &&
    hotspot.y !== undefined &&
    !disableHotspotCrop
  ) {
    url.searchParams.delete('fit');
    url.searchParams.delete('crop');

    const isPortrait = sanityImage.height > sanityImage.width;

    if (isPortrait) {
      url.searchParams.set('w', '800');
      url.searchParams.set('h', '1400');
    } else {
      url.searchParams.set('w', '800');
      url.searchParams.set('h', '1000');
    }

    url.searchParams.set('fit', 'crop');
    url.searchParams.set('crop', 'focalpoint');
    url.searchParams.set('fp-x', hotspot.x.toString());
    url.searchParams.set('fp-y', hotspot.y.toString());
  }

  imageSrc = url.toString();
} catch (e) {}

    const lqip = asset?.metadata?.lqip;
    const defaultPlaceholder = lqip ? 'blur' : 'empty';

    const modifiedForFocalPoint =
      isMobile && hotspot && hotspot.x !== undefined && hotspot.y !== undefined;

    if (modifiedForFocalPoint) {
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
      if (fill) {
        const { width, height, ...rest } = sanityImage;

        imageProps = {
          ...rest,
          src: imageSrc,
          placeholder: defaultPlaceholder
        };
      } else {
        imageProps = {
          ...sanityImage,
          src: imageSrc,
          placeholder: defaultPlaceholder
        };
      }
    }

    if (lqip) {
      imageProps.blurDataURL = lqip;
      imageProps.placeholder = 'blur';
    }
  } else {
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