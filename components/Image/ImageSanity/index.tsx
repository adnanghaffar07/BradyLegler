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
  /**
   * For full-viewport-height hero images (e.g. `fullWidth` collection header,
   * HeaderHeroSection). The default mobile focal-point crop targets a fixed
   * 800x1000/800x1400 box, which is much shorter/wider than a `min-height: 100vh`
   * hero on a phone — so the browser's own object-fit: cover re-crops the
   * already-focal-point-cropped image a second time, blind to the hotspot, and
   * can push it back out of frame. When true, the crop target uses a taller
   * aspect ratio representative of a full-height phone hero instead.
   */
  fullBleed?: boolean;
};

// Typical full-viewport-height phone hero aspect ratio (height/width). Modern
// phones range roughly 1.9-2.2; 2.0 is a reasonable middle ground that keeps a
// centered focal point in frame across that range without over-cropping.
const FULL_BLEED_ASPECT = 2.0;

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
    disableHotspotCrop = false,
    fullBleed = false
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
    const hasValidHotspot = !!(hotspot && hotspot.x !== undefined && hotspot.y !== undefined && !disableHotspotCrop);
    const usesOwnFocalPointCrop = smallImage || isMobile;

    // Hotspot coordinates (fp-x/fp-y, appended as URL params further below) are
    // always relative to the *original* full image. Sanity applies a manual `crop`
    // rect first, so if `crop` is also baked into the base URL here, fp-x/fp-y end
    // up being interpreted relative to that already-cropped sub-image instead —
    // misplacing the focal point (sometimes entirely outside the visible crop).
    // When we're about to build our own focal-point crop, exclude `crop` so it
    // operates on the original asset, matching where the hotspot was actually set.
    if (usesOwnFocalPointCrop && hasValidHotspot) {
      return { asset, hotspot };
    }

    return crop ? { asset, crop } : asset;
  }, [isMobile, asset, crop, hotspot, disableHotspotCrop, smallImage]);

  const sanityImage: any = useNextSanityImage(sanityClient, imageObject);

  let imageProps: any = {};

  if (sanityImage && sanityImage?.src && !error) {
    let imageSrc = sanityImage.src;
    let mobileCropWidth: number | undefined;
    let mobileCropHeight: number | undefined;

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

    mobileCropWidth = 800;

    if (fullBleed) {
      mobileCropHeight = Math.round(mobileCropWidth * FULL_BLEED_ASPECT);
    } else {
      const isPortrait = sanityImage.height > sanityImage.width;
      mobileCropHeight = isPortrait ? 1400 : 1000;
    }
    url.searchParams.set('w', String(mobileCropWidth));
    url.searchParams.set('h', String(mobileCropHeight));

    url.searchParams.set('fit', 'crop');
    url.searchParams.set('crop', 'focalpoint');
    url.searchParams.set('fp-x', hotspot.x.toString());
    url.searchParams.set('fp-y', hotspot.y.toString());
  }

  // Prioritized above-the-fold images: cap Sanity width so LCP avoids multi-megapixel downloads (layout unchanged)
    if (priority && !smallImage && sanityImage?.width) {
      const maxEdge = 2400;
      const rawW = url.searchParams.get('w');
      const effectiveW = rawW ? parseInt(rawW, 10) : sanityImage.width;
      if (!Number.isNaN(effectiveW) && effectiveW > maxEdge) {
        url.searchParams.set('fit', 'max');
        url.searchParams.set('w', String(maxEdge));
        url.searchParams.delete('h');
      }
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
        // Use the actual mobile focal-point crop dimensions, not the original
        // asset's dimensions — otherwise <Image> lays out the box for the wrong
        // aspect ratio while a differently-shaped cropped image is served underneath.
        imageProps = {
          src: imageSrc,
          width: mobileCropWidth || sanityImage.width,
          height: mobileCropHeight || sanityImage.height,
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
      fetchPriority={priority ? 'high' : undefined}
      loading={priority ? undefined : 'lazy'}
      alt={alt}
      fill={fill}
      onError={onError}
      unoptimized={false}
      {...imageProps}
    />
  );
};

export default ImageSanity;