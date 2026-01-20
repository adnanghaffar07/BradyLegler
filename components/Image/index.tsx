'use client';

import NextImage from 'next/image';
import { useState } from 'react';
import classNames from '@/helpers/classNames';
import breakpoints, { Breakpoints } from '@/tools/helpers/breakpoints';
import fallback from '@/assets/images/fallback.png';
import ImageSanity from './ImageSanity';

import styles from './styles.module.scss';

export type ImagePropsSanity = {
  asset: SanityImageAsset;
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  altText?: string;
  className?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  objectFit?: 'cover' | 'contain';
  sizes?: string | Breakpoints;
  fill?: boolean;
  aspectRatio?: SanityAspectRatio;
};

export type ImagePropsStandard = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  objectFit?: 'cover' | 'contain';
  sizes?: string | Breakpoints;
  fill?: boolean;
  aspectRatio?: SanityAspectRatio;
};

export type ImageProps = ImagePropsStandard | ImagePropsSanity;

const Image = (props: ImageProps) => {
  const {
    className,
    quality = 80,
    priority = false,
    sizes,
    objectFit = 'cover',
    aspectRatio = 'natural',
    placeholder,
    fill
  } = props;

  const [error, setError] = useState<any>(null);

  const classes = classNames(
    styles.container,
    aspectRatio ? styles[`ratio_${aspectRatio}`] : styles['ratio_natural'],
    styles[`object-fit_${objectFit}`],
    className
  );

  const getSizes = () => {
    if (!sizes) return undefined; // sizes={undefined}
    if (typeof sizes === 'string') return sizes; // sizes="100vw"
    const devices = Object.keys(sizes) as (keyof typeof breakpoints | 'any')[];
    return devices
      .reduce<string[]>((acc, device) => {
        const breakpointSize = sizes[device];
        if (device === 'any') {
          if (breakpointSize) acc.push(breakpointSize);
          return acc;
        }
        const breakpoint = breakpoints[device];
        if (breakpoint) acc.push(`(max-width: ${breakpoint}) ${breakpointSize}`);
        return acc;
      }, [])
      .join(', ');
  };

  const sizesAttributes = getSizes();

  if ('asset' in props) {
    const asset = props?.asset;
    if (!asset?.url) return null;

    return (
      <div className={classes}>
        <ImageSanity
          alt={props?.altText || asset?.altText || 'Image'}
          asset={props?.asset}
          crop={(props as any)?.crop}
          hotspot={(props as any)?.hotspot}
          className={styles.image}
          sizes={sizesAttributes}
          onError={setError}
          error={error}
          fallback={fallback}
          quality={quality}
          priority={priority}
          fill={fill}
          placeholder={placeholder}
        />
      </div>
    );
  }

  if ('src' in props) {
    const { src, alt, width, height, quality, priority } = props;
    return (
      <div className={classes}>
        <NextImage
          className={styles.image}
          src={error ? fallback : src}
          alt={alt || 'Image'}
          width={width}
          height={height}
          quality={quality}
          priority={priority}
          sizes={sizesAttributes}
          fill={fill}
          onError={setError}
        />
      </div>
    );
  }

  return (
    <div className={classes}>
      <NextImage
        className={styles.image}
        src={fallback}
        alt={'Fallback Image'}
        width={1203}
        height={900}
        quality={quality}
        priority={priority}
        sizes={sizesAttributes}
        fill={fill}
      />
    </div>
  );
};

// Image.Animated = ImageAnimated;

export default Image;
