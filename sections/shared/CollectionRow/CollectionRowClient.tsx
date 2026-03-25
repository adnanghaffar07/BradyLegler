'use client';

import React, { useState, useRef, useEffect } from 'react';
import Section from '@/components/Section';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

interface IGalleryMedia {
  _type: 'image' | 'video';
  src?: string;
  altText?: string;
  width?: number;
  height?: number;
  url?: string;
}

interface IGalleryImage {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}

interface ICollectionMediaItem {
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
}

interface IProduct {
  _id: string;
  store: {
    title: string;
    slug: {
      current: string;
    };
    previewImageUrl?: string;
    priceRange?: {
      minVariantPrice: number;
      maxVariantPrice: number;
    };
    gid?: string;
  };
  gallery?: {
    media?: IGalleryMedia[];
  };
  galleryImages?: IGalleryImage[];
  collectionMedia?: {
    enable?: boolean;
    mediaItems?: ICollectionMediaItem[];
    mediaType?: 'image' | 'video';
    video?: {
      asset?: {
        url: string;
      };
    };
    image?: {
      asset?: {
        url: string;
        metadata: {
          dimensions: {
            height: number;
            width: number;
          };
        };
      };
    };
  };
}

interface ICollectionRowClientProps {
  title?: string;
  products: IProduct[];
}

const CollectionRowClient: React.FC<ICollectionRowClientProps> = ({ title, products = [] }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filter valid products
  const validProducts = products.filter(
    product => product?._id && product?.store?.title && product?.store?.slug?.current
  );

  // Detect screen size for responsive calculations
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 769);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check scroll position
  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      // Add more buffer to account for mobile rendering differences
      const canScroll = scrollLeft < scrollWidth - clientWidth - 5;
      setCanScrollRight(canScroll);

      if (validProducts.length > 0) {
        // Keep track of the centered item so arrow clicks advance one card cleanly.
        const totalScrollable = Math.max(1, scrollWidth - clientWidth);
        const ratio = scrollLeft / totalScrollable;
        const nextIndex = Math.round(ratio * (validProducts.length - 1));
        setCurrentIndex(Math.max(0, Math.min(validProducts.length - 1, nextIndex)));
      }
    }
  };

  useEffect(() => {
    // Use a slight delay to ensure DOM has rendered and dimensions are correct
    const timeoutId = setTimeout(() => {
      checkScroll();
    }, 100);

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
        clearTimeout(timeoutId);
      };
    }
    return () => clearTimeout(timeoutId);
  }, [validProducts]);

  const scrollToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(validProducts.length - 1, index));
    const item = itemRefs.current[clampedIndex];
    item?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  // Navigation functions with snapping-to-item behavior
  const scroll = (direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    scrollToIndex(targetIndex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return; // Disable dragging on mobile
    setIsDragging(true);
    setDragStart(e.clientX - (scrollContainerRef.current?.scrollLeft || 0));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return; // Skip on mobile
    e.preventDefault();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = e.clientX - dragStart;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // EXACT COPY of ProductCard's image logic for gallery
  const getProductImages = (product: IProduct) => {
    let images: any[] = [];

    // Priority 1: collectionMedia with mediaItems array (from ProductCard)
    const isCollectionMediaEnabled = product?.collectionMedia?.enable;
    const collectionMediaItems = product?.collectionMedia?.mediaItems || [];

    if (isCollectionMediaEnabled && collectionMediaItems.length > 0) {
      images = collectionMediaItems;
    }
    // Priority 2: collectionMedia single item
    else if (isCollectionMediaEnabled && product.collectionMedia?.mediaType) {
      const singleMediaItem = {
        mediaType: product.collectionMedia.mediaType,
        alt: product.store.title,
        image: product.collectionMedia.image,
        video: product.collectionMedia.video
      };
      images = [singleMediaItem];
    }
    // Priority 3: Sanity gallery images (MEDIA GALLERY!)
    else {
      const galleryImages = product.gallery?.media || product.galleryImages || [];
      const sanityImages = galleryImages.filter((img: any) => {
        // Check if it's an image with src or url
        const hasImage = img._type === 'image' && (img.src || img.url);
        return hasImage;
      });

      if (sanityImages.length > 0) {
        images = sanityImages;
      }
    }

    return images;
  };

  // Get current image URL (always returns first/featured image)
  const getCurrentImage = (product: IProduct) => {
    const images = getProductImages(product);

    // Always use the first image
    const image = images.length > 0 ? images[0] : null;

    if (image) {
      // Handle different image formats
      let imageUrl: string | undefined;
      let altText: string | undefined;

      // Gallery image format
      if (image.src) {
        imageUrl = image.src;
        altText = image.altText;
      }
      // Gallery media format
      else if (image.url) {
        imageUrl = image.url;
        altText = image.altText;
      }
      // Collection media format
      else if (image.image?.asset?.url) {
        imageUrl = image.image.asset.url;
        altText = image.alt;
      }
      // String format
      else if (typeof image === 'string') {
        imageUrl = image;
        altText = product.store.title;
      }

      if (imageUrl) {
        return {
          src: imageUrl,
          alt: altText || product.store.title
        };
      }
    }

    // Fallback to previewImageUrl
    if (product.store.previewImageUrl) {
      return {
        src: product.store.previewImageUrl,
        alt: product.store.title
      };
    }

    return null;
  };

  if (validProducts.length === 0) {
    return (
      <Section
        name="HomeCollectionsSection"
        full
        removeBottomSpacing
        removeTopSpacing
        className={styles.section}
        theme="light"
      >
        <Layout variant="fullWidth" className={styles.layout}>
          <p className={styles.noItems}>No products available.</p>
        </Layout>
      </Section>
    );
  }

  const showCarouselArrows = validProducts.length > 1;

  return (
    <Section
      name="HomeCollectionsSection"
      full
      removeBottomSpacing
      removeTopSpacing
      className={styles.section}
      theme="light"
    >
      <Layout variant="fullWidth" className={styles.layout}>
        <div className={styles.carouselWrapper}>
          {showCarouselArrows && (
            <button
              className={classNames(styles.carouselArrowLeft, {
                [styles.disabled]: !canScrollLeft
              })}
              onClick={() => scroll('left')}
              aria-label="Scroll carousel left"
              disabled={!canScrollLeft}
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
          )}

          <div
            className={styles.carouselContainer}
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {validProducts.map((product, index) => {
              const currentImage = getCurrentImage(product);

              return (
                <div
                  key={product._id}
                  className={styles.carouselItem}
                  ref={el => {
                    itemRefs.current[index] = el;
                  }}
                >
                  <div className={styles.imageWrapper}>
                    {currentImage && (
                      <Link href={`/product/${product.store.slug.current}`} className={styles.link}>
                        <div className={styles.imageContainer}>
                          <Image
                            src={currentImage.src}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            alt={currentImage.alt || product.store.title || ''}
                            className={styles.img}
                          />
                        </div>
                      </Link>
                    )}
                  </div>

                  <h4 className={styles.name}>{product.store.title}</h4>

                  {/* Uncomment to show price
                  {product.store.priceRange && (
                    <Text
                      text={formatCurrency({ 
                        amount: product.store.priceRange.minVariantPrice 
                      })}
                      className={styles.price}
                      size="b3"
                    />
                  )}
                  */}
                </div>
              );
            })}
          </div>

          {showCarouselArrows && (
            <button
              className={classNames(styles.carouselArrowRight, {
                [styles.disabled]: !canScrollRight
              })}
              onClick={() => scroll('right')}
              aria-label="Scroll carousel right"
              disabled={!canScrollRight}
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
          )}
        </div>
      </Layout>
    </Section>
  );
};

export default CollectionRowClient;
