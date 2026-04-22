'use client';

import React from 'react';
import Section from '@/components/Section';
import Image from '@/components/Image';
import Link from '@/components/Link';
import classNames from '@/tools/helpers/classNames';
import { IImageGallerySection } from '@/tools/sanity/schema/sections/shared/imageGallerySection';
import styles from './styles.module.scss';

const ImageGallerySection: React.FC<IImageGallerySection> = ({
  images,
  className,
  columns = 3,
  gap = '1rem',
}) => {
  // Group images by size
  const groupedImages = {
    large: images?.filter(img => img.size === 'large') || [],
    medium: images?.filter(img => img.size === 'medium') || [],
    small: images?.filter(img => img.size === 'small') || [],
  };

  // Create rows of up to 3 items per row
  const createRows = (items: typeof images) => {
    const rows = [];
    for (let i = 0; i < (items?.length || 0); i += columns) {
      rows.push(items?.slice(i, i + columns));
    }
    return rows;
  };

  const renderImageItem = (item: NonNullable<typeof images>[0], index: number) => {
    const imageContent = (
      <div className={styles.imageWrapper}>
        <Image
          {...item.image}
          className={styles.image}
          aspectRatio={item.image?.aspectRatio || 'natural'}
          objectFit="cover"
        />
      </div>
    );

    if (item.link) {
      return (
        <Link
          key={index}
          {...item.link}
          variant="content"
          className={classNames(styles.imageItem, styles[item.size || 'medium'])}
        >
          {imageContent}
        </Link>
      );
    }

    return (
      <div key={index} className={classNames(styles.imageItem, styles[item.size || 'medium'])}>
        {imageContent}
      </div>
    );
  };

  return (
    <Section name="ImageGallerySection" theme="light-dark" className={className}>
      <div className={styles.gallery} style={{ '--gap': gap } as React.CSSProperties}>
        {/* Large Images Row */}
        {groupedImages.large.length > 0 && (
          <div className={styles.row}>
            {createRows(groupedImages.large).map((row, rowIndex) => (
              <div key={`large-row-${rowIndex}`} className={styles.rowContainer}>
                {row?.map((item, index) => renderImageItem(item, index))}
              </div>
            ))}
          </div>
        )}

        {/* Medium Images Row */}
        {groupedImages.medium.length > 0 && (
          <div className={styles.row}>
            {createRows(groupedImages.medium).map((row, rowIndex) => (
              <div key={`medium-row-${rowIndex}`} className={styles.rowContainer}>
                {row?.map((item, index) => renderImageItem(item, index))}
              </div>
            ))}
          </div>
        )}

        {/* Small Images Row */}
        {groupedImages.small.length > 0 && (
          <div className={styles.row}>
            {createRows(groupedImages.small).map((row, rowIndex) => (
              <div key={`small-row-${rowIndex}`} className={styles.rowContainer}>
                {row?.map((item, index) => renderImageItem(item, index))}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
};

export default ImageGallerySection;