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
import Price from '@/templates/ProductTemplate/components/Price';
import Image from 'next/image';

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
        {/* LEFT COLUMN - Collection Info (Sticky) */}
    <div className={styles.leftColumn}>
  {primaryCollection?.store ? (
    <div className={styles.collectionInfo}>
      <div className={styles.collectionHeader}>
        {primaryCollection.store.title && (
          <Text size="b2" className={styles.collectionName}>
            {primaryCollection.store.title}
          </Text>
        )}
      </div>

      {primaryCollection.store.collectionStory &&
       primaryCollection.store.collectionStory.trim() !== '' && (
        <div className={styles.collectionStory}>
          <Text size="b2" className={styles.storyText}>
            {primaryCollection.store.collectionStory}
          </Text>
        </div>
      )}
    </div>
  ) : null}
</div>

        {/* CENTER COLUMN - Gallery (Natural Scroll) */}
        <div className={styles.gallery}>
          <Gallery
            featureMedia={sanityProductData?.featureMedia}
            gallery={sanityProductData?.gallery}
            images={shopifyProductData?.images?.edges?.map(({ node }) => node)}
          />
        </div>

        {/* RIGHT COLUMN - Product Details (Sticky) */}
        <div className={styles.container}>
          <div className={styles.containerSticky}>
            <Container>
              <div id="details" className={styles.detailsRight}>
                <div className={styles.header}>
                  <Text size="b2" text={sanityProductData.store.title} />
                  {/* <Price 
                    price={price} 
                    compareAtPrice={compareAtPrice} 
                  /> */}
                </div>

                <Description
                  title={sanityProductData.store.title}
                  descriptionHtml={shopifyProductData?.descriptionHtml}
                  sanitySizeGuide={sanitySizeGuide}
                  collections={shopifyProductData?.collections}
                />

                <Form
                  currencyCode={shopifyProductData?.priceRange?.minVariantPrice?.currencyCode || 'USD'}
                  variants={variants}
                  sanityProductData={sanityProductData}
                  setSelectedVariant={setSelectedVariant}
                  selectedVariant={selectedVariant}
                />
              </div>
            </Container>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Details;