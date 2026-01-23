'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Text from '@/components/Text';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

type ArtworkCardProps = {
  artwork: {
    _id: string;
    title: string;
    pathname: string;
    specification?: string;
    featureImage?: {
      asset?: {
        url: string;
        metadata?: {
          dimensions?: {
            width: number;
            height: number;
          };
        };
      };
      alt?: string;
    };
  };
  isSold?: boolean;
};

const ArtworkCard: React.FC<ArtworkCardProps> = ({ artwork, isSold }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const { _id, title, pathname, specification, featureImage } = artwork;

  const imageUrl = featureImage?.asset?.url;
  const imageAlt = featureImage?.alt || title;
  const width = featureImage?.asset?.metadata?.dimensions?.width || 540;
  const height = featureImage?.asset?.metadata?.dimensions?.height || 660;

  return (
    <div className={styles.artworkCard}>
      <Link href={pathname || '#'} className={styles.link}>
        <div className={styles.imageWrapper}>
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={imageAlt}
              width={width}
              height={height}
              className={classNames(styles.image, { [styles.loaded]: imageLoaded })}
              onLoad={() => setImageLoaded(true)}
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          )}
          {isSold && (
            <div className={styles.soldBadge}>
              <Text text="Sold" size="b3" />
            </div>
          )}
        </div>
        <div className={styles.details}>
          <Text text={title} className={styles.title} size="b2" />
          {specification && !isSold && (
            <Text text={specification} className={styles.specification} size="b3" />
          )}
        </div>
      </Link>
    </div>
  );
};

export default ArtworkCard;
