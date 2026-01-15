'use client';

import React, { useState } from 'react';
import Section from '@/components/Section';
import Description from '../Description';
import Gallery from '../Gallery';
import Text from '@/components/Text';
import Form from '../Form';
import Container from '@/components/Container';
import { GetProductByHandleResponse } from '@/tools/apis/shopify';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import styles from './styles.module.scss';

interface CollectionData {
  store?: {
    title?: string;
    collectionStory?: string;
    slug?: { current?: string };
    imageUrl?: string;
    id?: string;
  };
}

type DetailsProps = {
  sanityProductData: IProductDocument;
  sanitySizeGuide: ISizeGuideDocument;
  shopifyProductData: GetProductByHandleResponse;
  primaryCollection?: CollectionData | null;
};

const Details: React.FC<DetailsProps> = ({
  sanityProductData,
  shopifyProductData,
  sanitySizeGuide,
  primaryCollection
}) => {
  const variants = shopifyProductData?.variants?.edges?.map(({ node }) => node) || [];
  const defaultVariant = variants[0];
  const [selectedVariant, setSelectedVariant] = useState<any>(defaultVariant);

  const priceAmount = selectedVariant?.priceV2?.amount || shopifyProductData?.priceRange?.minVariantPrice?.amount;
  const compareAtPriceAmount = selectedVariant?.compareAtPriceV2?.amount;
  const price = priceAmount ? priceAmount.toString() : '0';
  const compareAtPrice = compareAtPriceAmount ? compareAtPriceAmount.toString() : undefined;

  return (
    <Section theme="dark" spacing="none" full>
      <div className={styles.section}>
        {/* Left Column - Collection Info */}
        {primaryCollection?.store && (
          <div className={styles.leftColumn}>
            <div className={styles.collectionInfoLeft}>
              <div className={styles.collectionHeaderLeft}>
                {primaryCollection.store.title && (
                  <Text size="b2" className={styles.collectionNameLeft}>
                    {primaryCollection.store.title}
                  </Text>
                )}
              </div>

              {primaryCollection.store.collectionStory &&
                primaryCollection.store.collectionStory.trim() !== '' && (
                  <div className={styles.collectionStoryLeft}>
                    <Text size="b2" className={styles.storyTextLeft}>
                      {primaryCollection.store.collectionStory}
                    </Text>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Center Column - Gallery */}
        <div className={styles.gallery}>
          <Gallery
            featureMedia={sanityProductData?.featureMedia}
            gallery={sanityProductData?.gallery}
            images={shopifyProductData?.images?.edges?.map(({ node }) => node)}
          />
        </div>

        {/* Right Column - Product Details */}
        <div className={styles.rightColumn}>
          <div className={styles.containerStickyRight}>
            <div id="details" className={styles.detailsRightSection}>
              <div className={styles.headerRight}>
                <Text size="b2" text={sanityProductData.store.title} />
              </div>

              <div className={styles.productDescriptionRight}>
                <Description
                  title={sanityProductData.store.title}
                  sanitySizeGuide={sanitySizeGuide}
                  descriptionHtml={shopifyProductData?.descriptionHtml}
                  collections={shopifyProductData?.collections}
                />
              </div>

              <Form
                currencyCode={shopifyProductData?.priceRange?.minVariantPrice?.currencyCode || 'USD'}
                variants={variants}
                sanityProductData={sanityProductData}
                setSelectedVariant={setSelectedVariant}
                selectedVariant={selectedVariant}
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Details;