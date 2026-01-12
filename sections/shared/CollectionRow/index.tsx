'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import Layout from '@/components/Layout';
import Image from 'next/image';
import Link from 'next/link';
import Text from '@/components/Text';
import formatCurrency from '@/helpers/formatCurrency';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

// Copy the exact same types from ProductCard for gallery
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
  // Check for gallery fields (like ProductCard does)
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

interface IHomeCollectionsSection {
  title?: string;
  products?: IProduct[];
}

const HomeCollectionsSection: React.FC<IHomeCollectionsSection> = ({ 
  title, 
  products = [] 
}) => {
  const [currentImageIndexes, setCurrentImageIndexes] = useState<{[key: string]: number}>({});

  // Filter valid products
  const validProducts = products.filter(product => 
    product?._id && 
    product?.store?.title && 
    product?.store?.slug?.current
  );

  // Navigation functions
  const nextImage = (productId: string, imagesLength: number) => {
    const currentIndex = currentImageIndexes[productId] || 0;
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: (currentIndex + 1) % imagesLength
    }));
  };

  const prevImage = (productId: string, imagesLength: number) => {
    const currentIndex = currentImageIndexes[productId] || 0;
    setCurrentImageIndexes(prev => ({
      ...prev,
      [productId]: currentIndex === 0 ? imagesLength - 1 : currentIndex - 1
    }));
  };

  // EXACT COPY of ProductCard's image logic for gallery
  const getProductImages = (product: IProduct) => {
    console.log(`🔍 Getting images for "${product.store.title}":`, {
      gallery: product.gallery,
      galleryImages: product.galleryImages,
      collectionMedia: product.collectionMedia
    });

    let images: any[] = [];
    let source = 'none';

    // Priority 1: collectionMedia with mediaItems array (from ProductCard)
    const isCollectionMediaEnabled = product?.collectionMedia?.enable;
    const collectionMediaItems = product?.collectionMedia?.mediaItems || [];

    if (isCollectionMediaEnabled && collectionMediaItems.length > 0) {
      console.log('✅ Using COLLECTION MEDIA with mediaItems array');
      source = 'collectionMedia';
      images = collectionMediaItems;
    }
    // Priority 2: collectionMedia single item
    else if (isCollectionMediaEnabled && product.collectionMedia?.mediaType) {
      console.log('✅ Using COLLECTION MEDIA single item');
      source = 'collectionMedia (single)';
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
        console.log('Checking gallery item:', { img, hasImage });
        return hasImage;
      });
      
      if (sanityImages.length > 0) {
        console.log('✅ Using SANITY GALLERY images');
        source = 'sanityGallery';
        images = sanityImages;
      }
    }

    console.log(`📊 Final image decision for "${product.store.title}":`, {
      source,
      imagesCount: images.length,
      images: images.map(img => ({
        type: img._type || img.mediaType,
        src: img.src || img.url || img.image?.asset?.url,
        alt: img.altText || img.alt
      }))
    });

    return images;
  };

  // Get current image URL (adapted from ProductCard)
  const getCurrentImage = (product: IProduct) => {
    const currentIndex = currentImageIndexes[product._id] || 0;
    const images = getProductImages(product);
    
    if (images.length > 0 && images[currentIndex]) {
      const image = images[currentIndex];
      
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

  // Image navigation component
  const ImageNavigation = ({
    productId,
    imagesLength,
    onPrev,
    onNext
  }: {
    productId: string;
    imagesLength: number;
    onPrev: () => void;
    onNext: () => void;
  }) => {
    if (imagesLength <= 1) return null;

    const currentIndex = currentImageIndexes[productId] || 0;

    return (
      <>
        <button
          className={styles.navArrowLeft}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onPrev();
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
          className={styles.navArrowRight}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onNext();
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

        <div className={styles.imageDots}>
          {Array.from({ length: imagesLength }).map((_, index) => (
            <button
              key={index}
              className={`${styles.imageDot} ${index === currentIndex ? styles.active : ''}`}
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentImageIndexes(prev => ({
                  ...prev,
                  [productId]: index
                }));
              }}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </>
    );
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
        {/* {title && <h2 className={styles.title}>{title}</h2>} */}

        <div className={styles.grid}>
          {validProducts.map((product) => {
            const images = getProductImages(product);
            const imagesLength = images.length || (product.store.previewImageUrl ? 1 : 0);
            const hasMultipleImages = imagesLength > 1;
            const currentImage = getCurrentImage(product);

            console.log(`🎯 Rendering "${product.store.title}":`, {
              imagesCount: images.length,
              imagesLength,
              hasMultipleImages,
              hasCurrentImage: !!currentImage,
              currentImageSrc: currentImage?.src?.substring(0, 50)
            });

            return (
              <div 
                key={product._id}
                className={classNames(styles.item, {
                  [styles.hasMultipleImages]: hasMultipleImages
                })}
              >
                <div className={styles.imageWrapper}>
                  {currentImage && (
                    <Link 
                      href={`/product/${product.store.slug.current}`}
                      className={styles.link}
                    >
                      <div className={styles.imageContainer}>
                        <Image
                          src={currentImage.src}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          alt={currentImage.alt || product.store.title || ''}
                          className={styles.img}
                        />
                        
                        {hasMultipleImages && (
                          <ImageNavigation
                            productId={product._id}
                            imagesLength={imagesLength}
                            onPrev={() => prevImage(product._id, imagesLength)}
                            onNext={() => nextImage(product._id, imagesLength)}
                          />
                        )}
                      </div>
                    </Link>
                  )}
                </div>
                
                <h4 className={styles.name}>{product.store.title}</h4>
                
                {/* {product.store.priceRange && (
                  <Text
                    text={formatCurrency({ 
                      amount: product.store.priceRange.minVariantPrice 
                    })}
                    className={styles.price}
                    size="b3"
                  />
                )} */}
              </div>
            );
          })}
        </div>
      </Layout>
    </Section>
  );
};

export default HomeCollectionsSection;