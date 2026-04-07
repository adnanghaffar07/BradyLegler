'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Text from '@/components/Text';
import ProductCard from '@/components/ProductCard';
import classNames from '@/helpers/classNames';
import type { ShopifyProduct } from '@/tools/apis/shopify';
import rowStyles from '@/sections/shared/CollectionRow/styles.module.scss';
import styles from './styles.module.scss';

type InquiryEntry = { inquireButtonEnabled?: boolean; inquirePriceText?: string };

type ExtendedShopify = ShopifyProduct & {
  collectionMedia?: {
    enable?: boolean;
    mediaItems?: Array<{ mediaType?: string; image?: { asset?: { url?: string } }; alt?: string }>;
    mediaType?: string;
    image?: { asset?: { url?: string } };
  };
  gallery?: { media?: Array<{ _type?: string; src?: string; altText?: string }> };
  galleryImages?: Array<{ src: string; altText?: string }>;
};

function getCarouselImage(product: ExtendedShopify): { src: string; alt: string } | null {
  const title = product.title || '';

  if (product.collectionMedia?.enable && product.collectionMedia.mediaItems?.length) {
    const first = product.collectionMedia.mediaItems[0];
    if (first?.mediaType === 'image' && first.image?.asset?.url) {
      return { src: first.image.asset.url, alt: first.alt || title };
    }
  }
  if (product.collectionMedia?.enable && product.collectionMedia.mediaType === 'image' && product.collectionMedia.image?.asset?.url) {
    return { src: product.collectionMedia.image.asset.url, alt: title };
  }

  const gallery = product.gallery?.media?.filter(m => m._type === 'image' && m.src) || [];
  if (gallery[0]?.src) {
    return { src: gallery[0].src, alt: gallery[0].altText || title };
  }
  if (product.galleryImages?.[0]?.src) {
    return { src: product.galleryImages[0].src, alt: product.galleryImages[0].altText || title };
  }

  const shopifySrc = product.images?.edges?.[0]?.node?.src;
  if (shopifySrc) return { src: shopifySrc, alt: title };

  return null;
}

const RecommendationsClient = ({
  products,
  inquiryFlags
}: {
  products: ExtendedShopify[];
  inquiryFlags: Record<string, InquiryEntry>;
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const validProducts = products.filter(p => p?.id && p?.handle);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);

    if (validProducts.length > 0) {
      const totalScrollable = Math.max(1, scrollWidth - clientWidth);
      const ratio = scrollLeft / totalScrollable;
      const nextIndex = Math.round(ratio * (validProducts.length - 1));
      setCurrentIndex(Math.max(0, Math.min(validProducts.length - 1, nextIndex)));
    }
  };

  useEffect(() => {
    const t = setTimeout(checkScroll, 100);
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        clearTimeout(t);
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
    return () => clearTimeout(t);
  }, [validProducts.length]);

  const scrollToIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(validProducts.length - 1, index));
    itemRefs.current[clamped]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  };

  const calculateScrollAmount = () => {
    if (!scrollContainerRef.current) return 300;
    const w = scrollContainerRef.current.clientWidth;
    const isDesktop = w >= 1024;
    const isTablet = w >= 769 && w < 1024;
    let itemsVisible = 4;
    let gap = 24;
    if (isTablet) {
      itemsVisible = 3;
    } else if (!isDesktop && w < 769) {
      itemsVisible = 1;
      gap = 16;
    }
    const totalGap = gap * (itemsVisible - 1);
    const itemWidth = (w - totalGap) / itemsVisible;
    return itemWidth + gap;
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    if (!isMobile) {
      const amount = calculateScrollAmount();
      const target =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - amount
          : scrollContainerRef.current.scrollLeft + amount;
      scrollContainerRef.current.scrollTo({ left: target, behavior: 'smooth' });
      return;
    }
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    scrollToIndex(targetIndex);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragStart(e.clientX - (scrollContainerRef.current?.scrollLeft || 0));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isMobile) return;
    e.preventDefault();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = e.clientX - dragStart;
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const showCarouselArrows = validProducts.length > 1;

  if (validProducts.length === 0) return null;

  return (
    <section className={styles.recommendationsSection}>
      <div className={styles.container}>
        <Text as="h2" text="You May Also Like" size="b1" className={styles.title} />

        {/* Desktop / tablet: grid of cards, no in-card gallery arrows */}
        <div className={styles.desktopGrid}>
          <div className={`${styles.grid} ${styles[`grid-${validProducts.length}`]}`}>
            {validProducts.map(product => (
              <div key={product.id} className={styles.productWrapper}>
                <ProductCard
                  shopifyProduct={product}
                  inquiryEnabled={inquiryFlags[product.handle ?? '']?.inquireButtonEnabled}
                  inquirePriceText={inquiryFlags[product.handle ?? '']?.inquirePriceText}
                  hideGalleryNavigation
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: same carousel + arrows as Collection Row */}
        <div className={styles.mobileCarousel}>
          <div className={rowStyles.carouselWrapper}>
            {showCarouselArrows && (
              <button
                type="button"
                className={classNames(rowStyles.carouselArrowLeft, {
                  [rowStyles.disabled]: !canScrollLeft
                })}
                onClick={() => scroll('left')}
                aria-label="Scroll recommendations left"
                disabled={!canScrollLeft}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="#333"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}

            <div
              className={rowStyles.carouselContainer}
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {validProducts.map((product, index) => {
                const img = getCarouselImage(product);
                const href = `/${product.handle}/`;

                return (
                  <div
                    key={product.id}
                    className={rowStyles.carouselItem}
                    ref={el => {
                      itemRefs.current[index] = el;
                    }}
                  >
                    <div className={rowStyles.imageWrapper}>
                      {img && (
                        <Link href={href} className={rowStyles.link}>
                          <div className={rowStyles.imageContainer}>
                            <Image
                              src={img.src}
                              fill
                              sizes="(max-width: 768px) 50vw, 25vw"
                              alt={img.alt}
                              className={rowStyles.img}
                            />
                          </div>
                        </Link>
                      )}
                    </div>
                    <h4 className={rowStyles.name}>{product.title}</h4>
                  </div>
                );
              })}
            </div>

            {showCarouselArrows && (
              <button
                type="button"
                className={classNames(rowStyles.carouselArrowRight, {
                  [rowStyles.disabled]: !canScrollRight
                })}
                onClick={() => scroll('right')}
                aria-label="Scroll recommendations right"
                disabled={!canScrollRight}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="#333"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default RecommendationsClient;
