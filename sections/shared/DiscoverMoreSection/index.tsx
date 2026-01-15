'use client';

import React, { useState, useCallback, useEffect } from 'react';
import Section from '@/components/Section';
import Text from '@/components/Text';
import Link from '@/components/Link';
import Video from '@/components/Video';
import Image from '@/components/Image';
import Carousel from '@/components/Carousel';
import formatCurrency from '@/helpers/formatCurrency';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import { IDiscoverMoreSection } from '@/tools/sanity/schema/sections/shared/discoverMoreSection';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

// Type for extended product data
type ExtendedProduct = {
  store?: {
    collectionMedia?: {
      enable?: boolean;
      mediaItems?: Array<{
        mediaType?: 'video' | 'image';
        alt?: string;
        image?: {
          asset?: {
            url: string;
            metadata?: {
              dimensions?: {
                width: number;
                height: number;
              };
            };
          };
        };
        video?: {
          asset?: {
            url: string;
          };
        };
      }>;
      mediaType?: 'image' | 'video';
      video?: {
        asset?: {
          url: string;
        };
      };
      image?: {
        asset?: {
          url: string;
          metadata?: {
            dimensions: {
              height: number;
              width: number;
            };
          };
        };
      };
    };
    gallery?: {
      media?: Array<{
        _type: 'image' | 'video';
        src?: string;
        altText?: string;
        width?: number;
        height?: number;
        url?: string;
      }>;
    };
    galleryImages?: Array<{
      src: string;
      altText?: string;
      width?: number;
      height?: number;
    }>;
    priceRange?: {
      minVariantPrice:
        | number
        | string
        | {
            amount: string | number;
            currencyCode?: string;
          };
    };
    slug?: {
      current: string;
    };
    title?: string;
    previewImageUrl?: string;
  };
  title?: string;
  pathname?: string;
  _type?: string;
  status?: string;
  featureImage?: any;
  featureMedia?: {
    enable?: boolean;
    mediaType?: 'video' | 'image';
    video?: {
      asset?: {
        url: string;
      };
    };
    image?: {
      asset?: {
        url: string;
        metadata?: {
          dimensions: {
            height: number;
            width: number;
          };
        };
      };
    };
  };
};

const DiscoverMoreItem: React.FC<{ item: ExtendedProduct; index: number }> = ({ item, index }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const { _type, pathname, store, title, status, featureImage = {}, featureMedia = {} } = item;

  // Determine media sources based on ProductCard logic
  const isCollectionMediaEnabled = store?.collectionMedia?.enable;
  const collectionMediaItems = store?.collectionMedia?.mediaItems || [];
  const featureMediaEnabled = featureMedia?.enable;

  const slug = store?.slug?.current ? `/${store?.slug?.current}/` : pathname || '#';
  const itemTitle = _type === 'artwork' ? title : store?.title || title;

  // FIXED: Proper price extraction and formatting
  let secondaryText = '';

  if (_type === 'product') {
    let priceAmount: number | null = null;
    let currencyCode = 'USD';

    // Handle different price structures
    const minVariantPrice = store?.priceRange?.minVariantPrice;

    // Case 1: Price is an object with amount and currencyCode
    if (minVariantPrice && typeof minVariantPrice === 'object' && 'amount' in minVariantPrice) {
      priceAmount =
        typeof minVariantPrice.amount === 'string'
          ? parseFloat(minVariantPrice.amount)
          : Number(minVariantPrice.amount);
      currencyCode = minVariantPrice.currencyCode || 'USD';
    }
    // Case 2: Price is a direct number or string
    else if (minVariantPrice !== undefined && minVariantPrice !== null) {
      priceAmount = typeof minVariantPrice === 'string' ? parseFloat(minVariantPrice) : Number(minVariantPrice);
    }

    // Format the price if we have a valid amount
    if (priceAmount !== null && !isNaN(priceAmount)) {
      secondaryText = formatCurrency({
        amount: priceAmount,
        currencyCode
      });
    } else {
      secondaryText = '$0.00';
    }
  } else if (_type === 'artwork') {
    secondaryText = status === 'onSale' ? 'Available' : 'Sold out';
  }

  // Priority 1: collectionMedia with mediaItems array
  let images: any[] = [];
  let currentMedia: any = null;

  if (isCollectionMediaEnabled && collectionMediaItems.length > 0) {
    images = collectionMediaItems;
    currentMedia = images[currentImageIndex];
  }
  // Priority 2: collectionMedia single item
  else if (isCollectionMediaEnabled && store?.collectionMedia?.mediaType) {
    currentMedia = {
      mediaType: store.collectionMedia.mediaType,
      alt: itemTitle,
      image: store.collectionMedia.image,
      video: store.collectionMedia.video
    };
    images = [currentMedia];
  }
  // Priority 3: Feature media
  else if (featureMediaEnabled && featureMedia.mediaType) {
    currentMedia = {
      mediaType: featureMedia.mediaType,
      alt: itemTitle,
      image: featureMedia.image,
      video: featureMedia.video
    };
    images = [currentMedia];
  }
  // Priority 4: Feature image or fallback
  else if (featureImage?.asset?.url || store?.previewImageUrl) {
    currentMedia = {
      mediaType: 'image',
      alt: itemTitle,
      image: featureImage?.asset?.url ? featureImage : { asset: { url: store?.previewImageUrl } }
    };
    images = [currentMedia];
  }
  // Priority 5: Gallery images
  else if (store?.gallery?.media?.length) {
    images = store.gallery.media;
    currentMedia = images[currentImageIndex];
  }

  const hasMultipleImages = images.length > 1;

  // Navigation handlers
  const nextImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentImageIndex(prev => (prev + 1) % images.length);
    }
  }, [images.length]);

  const prevImage = useCallback(() => {
    if (images.length > 1) {
      setCurrentImageIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
    }
  }, [images.length]);

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (window.innerWidth > 768) {
    }
  };

  const handleTouchStart = () => {};

  const handleTouchEnd = () => {
    setTimeout(() => {}, 3000);
  };

  // Render media based on type
  const renderMedia = () => {
    if (!currentMedia) {
      return <div className={styles.placeholder}>No media</div>;
    }

    const { mediaType } = currentMedia;

    if (mediaType === 'video') {
      const videoUrl = currentMedia.video?.asset?.url || currentMedia.video?.url;
      if (!videoUrl) return null;

      return (
        <>
          <Video url={videoUrl} className={styles.media} objectFit="contain" controls={false} autoPlay muted loop />
        </>
      );
    }

    // Handle images
    const imageUrl = currentMedia.image?.asset?.url || currentMedia.src || currentMedia.url;
    const imageAlt = currentMedia.alt || currentMedia.altText || itemTitle || '';

    if (!imageUrl) return null;

    // Get dimensions if available
    const dimensions = currentMedia.image?.asset?.metadata?.dimensions ||
      currentMedia.image?.metadata?.dimensions || { width: 800, height: 800 };

    return (
      <Image
        src={imageUrl}
        alt={imageAlt}
        width={dimensions.width}
        height={dimensions.height}
        className={styles.media}
        sizes="(max-width: 768px) 50vw, 33vw"
        quality={90}
      />
    );
  };

  return (
    <Link
      href={slug}
      key={index}
      className={styles.item}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Media Container */}
      <div className={styles.mediaContainer}>
        {renderMedia()}

        {/* Navigation Arrows (for multiple images within the product) */}
        {hasMultipleImages && (
          <>
            <button
              className={classNames(styles.navArrow, styles.navArrowLeft)}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                prevImage();
              }}
              aria-label="Previous image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className={classNames(styles.navArrow, styles.navArrowRight)}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                nextImage();
              }}
              aria-label="Next image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {/* Image Dots Indicator */}
            <div className={styles.imageDots}>
              {images.map((_, idx) => (
                <button
                  key={idx}
                  className={classNames(styles.imageDot, { [styles.active]: idx === currentImageIndex })}
                  onClick={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentImageIndex(idx);
                  }}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
      {/* Always visible details (matching ProductCard) */}
      <div className={styles.productDetails}>
        <Text text={itemTitle} size="b3" className={styles.productTitle} />
        {secondaryText && <Text text={secondaryText} size="b3" className={styles.productPrice} />}
      </div>
    </Link>
  );
};

const DiscoverMoreSection: React.FC<IDiscoverMoreSection> = props => {
  const { links, title } = props;
  const [isCarouselMode, setIsCarouselMode] = useState(true);

  const itemCount = links?.length || 0;

  useEffect(() => {
    // If 3 or fewer items, don't use carousel (items take full width)
    setIsCarouselMode(itemCount > 3);
  }, [itemCount]);

  const breakpoints = {
    '(min-width: 769px)': {
      active: isCarouselMode // Only show carousel arrows when in carousel mode
    }
  };

  return (
    <Section
      name="DiscoverMoreSection"
      theme="light"
      containerClassName={styles.container}
      {...getSectionSpacingProps(props)}
      full
    >
      <div className={styles.title}>
        <Text text={title} size="b1" />
      </div>

      <div
        className={classNames(styles.wrapper, {
          [styles.carouselMode]: isCarouselMode,
          [styles.gridMode]: !isCarouselMode
        })}
      >
        {isCarouselMode ? (
          <Carousel
            className={styles.carousel}
            containerClassName={styles.items}
            options={{
              active: true,
              startIndex: 1,
              loop: true,
              align: 'center',
              breakpoints
            }}
          >
            {links?.map((link, index) => (
              <DiscoverMoreItem key={index} item={link} index={index} />
            ))}
          </Carousel>
        ) : (
          <div className={styles.gridItems}>
            {links?.map((link, index) => (
              <DiscoverMoreItem key={index} item={link} index={index} />
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};

export default DiscoverMoreSection;
