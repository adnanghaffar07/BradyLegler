'use client';

import { useCallback, useState, useEffect } from 'react';
import Image from 'next/image';
import Text from '../Text';
import Link from '../Link';
import Layout from '@/components/Layout';
import { ShopifyProduct } from '@/tools/apis/shopify';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import classNames from '@/helpers/classNames';
import { useAnalytics } from '@/tools/analytics';
import Video from '@/components/Video';
import formatCurrency from '@/helpers/formatCurrency';
import styles from './styles.module.scss';

// Extended type for collectionMedia with mediaItems array
type ExtendedShopifyProduct = ShopifyProduct & {
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
  // Add collectionMedia with mediaItems array support
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
    // Keep backward compatibility fields
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
};

const ProductCard = ({
  shopifyProduct,
  sanityProduct,
  className,
  overlayDetailsOnMobile = false,
  collectionId,
  collectionTitle,
  layoutType
}: {
  shopifyProduct?: ExtendedShopifyProduct;
  sanityProduct?: IProductDocument['store'];
  className?: string;
  overlayDetailsOnMobile?: boolean;
  collectionId?: string | number;
  collectionTitle?: string;
  layoutType?: string;
}) => {
  const { trackSelectItem } = useAnalytics();
  const [active, setActive] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const isList = layoutType === 'list';

  const onProductClick = useCallback(() => {
    setActive(true);
    if (collectionId && collectionTitle && shopifyProduct) {
      trackSelectItem({
        listId: collectionId,
        listName: collectionTitle,
        currency: shopifyProduct.priceRange?.minVariantPrice?.currencyCode,
        item: {
          id: shopifyProduct.id || '',
          name: shopifyProduct?.title,
          category: shopifyProduct?.productType,
          price: shopifyProduct?.priceRange?.minVariantPrice?.amount
        }
      });
    }
  }, [collectionId, collectionTitle, shopifyProduct]);

  const nextImage = (imagesLength: number) => {
    setCurrentImageIndex((prev) => (prev + 1) % imagesLength);
    setIsVideoPlaying(false);
  };

  const prevImage = (imagesLength: number) => {
    setCurrentImageIndex((prev) => (prev === 0 ? imagesLength - 1 : prev - 1));
    setIsVideoPlaying(false);
  };

  const ListLink = ({ title, url }: { title: string; url: string }) => {
    if (!isList) return null;

    return (
      <div className={styles.listLink}>
        <Layout variant="container" className={styles.listLinkContainer}>
          <Link onClick={onProductClick} href={url} variant="square-overlay" text={title} className={styles.link}>
            {title}
          </Link>
        </Layout>
      </div>
    );
  };

  const ImageNavigation = ({
    imagesLength,
    onPrev,
    onNext,
    showDots = false
  }: {
    imagesLength: number;
    onPrev: () => void;
    onNext: () => void;
    showDots?: boolean;
  }) => {
    if (imagesLength <= 1) return null;

    return (
      <>
        <button
          className={styles.navArrowLeft}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          className={styles.navArrowRight}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next image"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showDots && imagesLength > 1 && (
          <div className={styles.imageDots}>
            {Array.from({ length: imagesLength }).map((_, index) => (
              <button
                key={index}
                className={`${styles.imageDot} ${index === currentImageIndex ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentImageIndex(index);
                  setIsVideoPlaying(false);
                }}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  if (sanityProduct) {
    const sanityImages = sanityProduct.images || [];
    const hasMultipleImages = sanityImages.length > 1;
    const currentImage = sanityImages[currentImageIndex] || sanityProduct.previewImageUrl;

    return (
      <div
        key={sanityProduct.gid}
        className={classNames(styles.productCard, className, {
          [styles.active]: active,
          [styles.list]: isList,
          [styles.alwaysShowDetails]: true
        })}
      >
        {currentImage && (
          <Link onClick={onProductClick} href={`/${sanityProduct.slug.current}/`} className={styles.imageLink}>
            <Image
              src={typeof currentImage === 'string' ? currentImage : (currentImage as any).url}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt=""
            />
            {hasMultipleImages && (
              <ImageNavigation
                imagesLength={sanityImages.length}
                onPrev={() => prevImage(sanityImages.length)}
                onNext={() => nextImage(sanityImages.length)}
                showDots={true}
              />
            )}
          </Link>
        )}

        <div className={styles.productDetails}>
          <Text text={sanityProduct.title} size="b3" className={styles.productTitle} />
          <Text
            text={formatCurrency({ amount: sanityProduct.priceRange?.minVariantPrice })}
            className={styles.productPrice}
            size="b3"
          />
        </div>

        <ListLink url={`/${sanityProduct.slug.current}/`} title={sanityProduct.title} />
      </div>
    );
  }

  if (shopifyProduct) {
    console.log('='.repeat(50));
    console.log('🔍 PRODUCT CARD START - Product:', shopifyProduct.title);
    console.log('='.repeat(50));

    // STEP 1: Log all incoming data
    console.log('📦 STEP 1 - All incoming data:', {
      title: shopifyProduct.title,
      hasCollectionMedia: !!shopifyProduct.collectionMedia,
      collectionMedia: shopifyProduct.collectionMedia,
      hasGallery: !!shopifyProduct.gallery,
      galleryItems: shopifyProduct.gallery?.media?.length || 0,
      hasShopifyImages: !!shopifyProduct.images?.edges?.length,
      shopifyImagesCount: shopifyProduct.images?.edges?.length || 0
    });

    // STEP 2: Check collection media
    const isCollectionMediaEnabled = shopifyProduct?.collectionMedia?.enable;
    const collectionMediaItems = shopifyProduct?.collectionMedia?.mediaItems || [];

    console.log('🔍 STEP 2 - Collection Media Analysis:', {
      isCollectionMediaEnabled,
      collectionMediaItemsCount: collectionMediaItems.length,
      collectionMediaItems: collectionMediaItems,
      hasMediaType: !!shopifyProduct.collectionMedia?.mediaType,
      mediaType: shopifyProduct.collectionMedia?.mediaType,
      hasImage: !!shopifyProduct.collectionMedia?.image?.asset?.url,
      hasVideo: !!shopifyProduct.collectionMedia?.video?.asset?.url
    });

    // STEP 3: Check other image sources
    const galleryImages = shopifyProduct.gallery?.media || shopifyProduct.galleryImages || [];
    const sanityImages = galleryImages.filter((img: any) => img._type === 'image' && img.src);
    const shopifyImages = shopifyProduct.images?.edges || [];

    console.log('🔍 STEP 3 - Other Image Sources:', {
      sanityImagesCount: sanityImages.length,
      shopifyImagesCount: shopifyImages.length,
      sanityImages: sanityImages.slice(0, 2), // Show first 2 for debugging
      shopifyImages: shopifyImages.slice(0, 2).map((img: any) => img.node?.src)
    });

    // STEP 4: Determine which images to use (priority order)
    let images: any[] = [];
    let currentImageSrc: string | undefined;
    let currentImageAlt: string | undefined;
    let useCollectionMedia = false;
    let useSanityGallery = false;
    let source = 'none';

    // Priority 1: collectionMedia with mediaItems array
    if (isCollectionMediaEnabled && collectionMediaItems.length > 0) {
      console.log('✅ STEP 4 - Using COLLECTION MEDIA with mediaItems array');
      useCollectionMedia = true;
      source = 'collectionMedia (multiple)';
      images = collectionMediaItems;

      const currentMedia = images[currentImageIndex];
      console.log('📸 Current collection media item:', currentMedia);

      if (currentMedia?.mediaType === 'image' && currentMedia.image?.asset?.url) {
        currentImageSrc = currentMedia.image.asset.url;
        currentImageAlt = currentMedia.alt;
        console.log('🖼️ Found image URL:', currentImageSrc);
      } else if (currentMedia?.mediaType === 'video' && currentMedia.video?.asset?.url) {
        currentImageSrc = currentMedia.video.asset.url;
        console.log('🎬 Found video URL:', currentImageSrc);
      } else {
        console.log('⚠️ Collection media item has no valid image/video URL');
      }
    }
    // Priority 2: collectionMedia single item (backward compatibility)
    else if (isCollectionMediaEnabled && shopifyProduct.collectionMedia?.mediaType) {
      console.log('✅ STEP 4 - Using COLLECTION MEDIA single item (backward compatibility)');
      useCollectionMedia = true;
      source = 'collectionMedia (single)';

      const singleMediaItem = {
        mediaType: shopifyProduct.collectionMedia.mediaType,
        alt: shopifyProduct.title,
        image: shopifyProduct.collectionMedia.image,
        video: shopifyProduct.collectionMedia.video
      };
      images = [singleMediaItem];

      if (shopifyProduct.collectionMedia.mediaType === 'image' && shopifyProduct.collectionMedia.image?.asset?.url) {
        currentImageSrc = shopifyProduct.collectionMedia.image.asset.url;
        currentImageAlt = shopifyProduct.title;
        console.log('🖼️ Found single image URL:', currentImageSrc);
      } else if (shopifyProduct.collectionMedia.mediaType === 'video' && shopifyProduct.collectionMedia.video?.asset?.url) {
        currentImageSrc = shopifyProduct.collectionMedia.video.asset.url;
        console.log('🎬 Found single video URL:', currentImageSrc);
      }
    }
    // Priority 3: Sanity gallery images
    else if (sanityImages.length > 0) {
      console.log('✅ STEP 4 - Using SANITY GALLERY images');
      useSanityGallery = true;
      source = 'sanityGallery';
      images = sanityImages;
      currentImageSrc = (images[currentImageIndex] as any)?.src;
      currentImageAlt = (images[currentImageIndex] as any)?.altText;
      console.log('🖼️ Found gallery image URL:', currentImageSrc);
    }
    // Priority 4: Shopify images
    else if (shopifyImages.length > 0) {
      console.log('✅ STEP 4 - Using SHOPIFY images');
      source = 'shopify';
      images = shopifyImages;
      currentImageSrc = (images[currentImageIndex] as any)?.node?.src;
      console.log('🖼️ Found Shopify image URL:', currentImageSrc);
    }
    else {
      console.log('❌ STEP 4 - NO IMAGE SOURCES FOUND');
    }

    // STEP 5: Final state
    const hasMultipleImages = images.length > 1;

    console.log('📊 STEP 5 - Final Decision:', {
      source,
      useCollectionMedia,
      useSanityGallery,
      imagesCount: images.length,
      hasMultipleImages,
      currentImageIndex,
      currentImageSrc,
      currentImageAlt
    });
    console.log('='.repeat(50));

    const ShopifyProductMedia = () => {
      console.log('🎨 RENDERING MEDIA - Product:', shopifyProduct.title);
      console.log('📱 Render State:', {
        currentImageIndex,
        imagesCount: images.length,
        currentImageSrc,
        source
      });

      // 1. First check: collectionMedia items
      if (useCollectionMedia && images[currentImageIndex]) {
        const currentMedia = images[currentImageIndex];
        console.log('🎯 Rendering collection media item:', currentMedia);

        if (currentMedia?.mediaType === 'video' && currentMedia.video?.asset?.url) {
          console.log('▶️  Rendering VIDEO:', currentMedia.video.asset.url);
          return (
            <>
              <Video
                url={currentMedia.video.asset.url}
                className={styles.video}
                objectFit="contain"
                controls={false}
              />
              {!isVideoPlaying && (
                <div className={styles.videoOverlay} />
              )}
            </>
          );
        }

        if (currentMedia?.mediaType === 'image' && currentMedia.image?.asset?.url) {
          console.log('🖼️  Rendering IMAGE:', {
            url: currentMedia.image.asset.url,
            width: currentMedia.image.asset.metadata?.dimensions?.width,
            height: currentMedia.image.asset.metadata?.dimensions?.height,
            alt: currentMedia.alt
          });
          return (
            <Image
              src={currentMedia.image.asset.url}
              width={currentMedia.image.asset.metadata?.dimensions?.width}
              height={currentMedia.image.asset.metadata?.dimensions?.height}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt={currentMedia.alt || shopifyProduct.title || ''}
              quality={90}
              onError={(e) => {
                console.error('❌ IMAGE LOAD ERROR:', e);
              }}
              onLoad={() => {
                console.log('✅ IMAGE LOADED SUCCESSFULLY');
              }}
            />
          );
        }

        console.log('⚠️ Collection media item is invalid');
      }

      // 2. Second check: Sanity gallery images
      if (useSanityGallery && sanityImages[currentImageIndex]?.src) {
        const currentImage = sanityImages[currentImageIndex];
        console.log('🖼️  Rendering Sanity gallery image:', currentImage.src);
        return (
          <Image
            src={currentImage.src}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt={currentImage.altText || ''}
            quality={90}
            onLoad={() => console.log('✅ Sanity gallery image loaded')}
          />
        );
      }

      // 3. Fallback: Original Shopify image
      if (currentImageSrc) {
        console.log('🖼️  Rendering Shopify image:', currentImageSrc);
        return (
          <Image
            src={currentImageSrc}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            alt=""
            onLoad={() => console.log('✅ Shopify image loaded')}
          />
        );
      }

      console.log('❌ NO MEDIA TO RENDER');
      return null;
    };

    return (
      <div
        key={shopifyProduct.id}
        className={classNames(styles.productCard, className, {
          [styles.active]: active,
          [styles.list]: isList,
          [styles.alwaysShowDetails]: true,
          [styles.usingCollectionMedia]: useCollectionMedia,
          [styles.usingSanityImage]: useSanityGallery,
          [styles.hasMultipleImages]: hasMultipleImages
        })}
      >
        {images.length > 0 && (
          <Link onClick={onProductClick} href={`/${shopifyProduct.handle}/`} className={styles.imageLink}>
            <ShopifyProductMedia />

            {hasMultipleImages && (
              <ImageNavigation
                imagesLength={images.length}
                onPrev={() => prevImage(images.length)}
                onNext={() => nextImage(images.length)}
                showDots={true}
              />
            )}
          </Link>
        )}

        <div className={styles.productDetails}>
          <Text text={shopifyProduct.title} size="b3" className={styles.productTitle} />
          <Text
            text={formatCurrency({
              amount: parseFloat(shopifyProduct.priceRange?.minVariantPrice?.amount || '0')
            })}
            className={styles.productPrice}
            size="b3"
          />
        </div>

        <ListLink url={`/${shopifyProduct.handle}/`} title={shopifyProduct.title} />
      </div>
    );
  }

  console.log('❌ PRODUCT CARD - No product data provided');
  return null;
};

export default ProductCard;