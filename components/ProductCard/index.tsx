'use client';

import { useCallback, useState } from 'react';
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

const ProductCard = ({
  shopifyProduct,
  sanityProduct,
  className,
  overlayDetailsOnMobile = false,
  collectionId,
  collectionTitle,
  layoutType
}: {
  shopifyProduct?: ShopifyProduct;
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
  };

  const prevImage = (imagesLength: number) => {
    setCurrentImageIndex((prev) => (prev === 0 ? imagesLength - 1 : prev - 1));
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

  // Image navigation arrows component
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
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          [styles.alwaysShowDetails]: true // Add this class
        })}
      >
        {currentImage && (
          <Link onClick={onProductClick} href={`/${sanityProduct.slug.current}/`} className={styles.imageLink}>
            <Image
              src={typeof currentImage === 'string' ? currentImage : currentImage.url}
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

        {/* Always show product details - no overlay */}
        <div className={styles.productDetails}>
          <Text text={sanityProduct.title} size="b3" className={styles.productTitle} />
          <Text
            text={formatCurrency({ amount: sanityProduct.priceRange?.minVariantPrice })}
            className={styles.productPrice}
            size="b3"
          />
          {/* Remove the "View" button if not needed */}
          {/* <Link
            onClick={onProductClick}
            className={styles.overlayButton}
            href={`/${sanityProduct.slug.current}/`}
            variant="square-overlay-light"
          >
            View
          </Link> */}
        </div>

        <ListLink url={`/${sanityProduct.slug.current}/`} title={sanityProduct.title} />
      </div>
    );
  }

  if (shopifyProduct) {
    const shopifyImages = shopifyProduct.images?.edges || [];
    const hasMultipleImages = shopifyImages.length > 1;
    const currentShopifyImage = shopifyImages[currentImageIndex]?.node?.src;

    const ShopifyProductMedia = () => {
      const isSanityCollectionMediaEnabled = shopifyProduct?.collectionMedia?.enable;

      if (isSanityCollectionMediaEnabled) {
        const isSanityCollectionMediaVideo = shopifyProduct?.collectionMedia?.mediaType === 'video';
        const isSanityCollectionMediaImage = shopifyProduct?.collectionMedia?.mediaType === 'image';
        const image = shopifyProduct.collectionMedia?.image?.asset;
        const video = shopifyProduct.collectionMedia?.video?.asset;

        if (isSanityCollectionMediaVideo && video) {
          return <Video url={video.url} className={styles.video} objectFit="contain" controls={false} />;
        }

        if (isSanityCollectionMediaImage && image) {
          return (
            <Image
              src={image.url}
              width={image.metadata?.dimensions?.width}
              height={image.metadata?.dimensions?.height}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              alt=""
            />
          );
        }
      }

      return currentShopifyImage ? (
        <Image
          src={currentShopifyImage}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          alt=""
        />
      ) : null;
    };

    return (
      <div
        key={shopifyProduct.id}
        className={classNames(styles.productCard, className, {
          [styles.active]: active,
          [styles.list]: isList,
          [styles.alwaysShowDetails]: true // Add this class
        })}
      >
        {currentShopifyImage && (
          <Link onClick={onProductClick} href={`/${shopifyProduct.handle}/`} className={styles.imageLink}>
            <ShopifyProductMedia />
            {hasMultipleImages && (
              <ImageNavigation
                imagesLength={shopifyImages.length}
                onPrev={() => prevImage(shopifyImages.length)}
                onNext={() => nextImage(shopifyImages.length)}
                showDots={true}
              />
            )}
          </Link>
        )}

        {/* Always show product details - no overlay */}
        <div className={styles.productDetails}>
          <Text text={shopifyProduct.title} size="b3" className={styles.productTitle} />
          <Text
            text={formatCurrency({ amount: shopifyProduct.priceRange?.minVariantPrice?.amount || 0 })}
            className={styles.productPrice}
            size="b3"
          />
          {/* Remove the "View" button if not needed */}
          {/* <Link
            onClick={onProductClick}
            className={styles.overlayButton}
            href={`/${shopifyProduct.handle}/`}
            variant="square-overlay-light"
          >
            View
          </Link> */}
        </div>

        <ListLink url={`/${shopifyProduct.handle}/`} title={shopifyProduct.title} />
      </div>
    );
  }
  return null;
};

export default ProductCard;