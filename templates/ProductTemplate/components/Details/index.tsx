'use client';

import React, { useState, useEffect } from 'react';
import Section from '@/components/Section';
import Description from '../Description';
import Gallery from '../Gallery';
import Text from '@/components/Text';
import Form from '../Form';
import Container from '@/components/Container';

import { GetProductByHandleResponse, GetProductRecommendationsResponse } from '@/tools/apis/shopify';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import styles from './styles.module.scss';
import Price from '@/templates/ProductTemplate/components/Price';

type DetailsProps = {
  sanityProductData: IProductDocument;
  sanitySizeGuide: ISizeGuideDocument;
  shopifyProductData: GetProductByHandleResponse;
  shopifyProductRecommendations: GetProductRecommendationsResponse;
};

const Details: React.FC<DetailsProps> = ({ sanityProductData, shopifyProductData, sanitySizeGuide }) => {
  // Get all variants
  const variants = shopifyProductData?.variants?.edges?.map(({ node }) => node) || [];

  // Set first variant as default
  const defaultVariant = variants[0];
  const [selectedVariant, setSelectedVariant] = useState<any>(defaultVariant);

  // Get price values as NUMBERS
  const priceAmount = selectedVariant?.priceV2?.amount ||
    shopifyProductData?.priceRange?.minVariantPrice?.amount;

  const compareAtPriceAmount = selectedVariant?.compareAtPriceV2?.amount;

  // Convert to STRINGS for Price component
  const price = priceAmount ? priceAmount.toString() : '0';
  const compareAtPrice = compareAtPriceAmount ? compareAtPriceAmount.toString() : undefined;

  // Debug logging
  useEffect(() => {
    console.log('=== PRICE DEBUG ===');
    console.log('Price amount:', priceAmount);
    console.log('Price as string:', price);
    console.log('Compare at price amount:', compareAtPriceAmount);
    console.log('Compare at price as string:', compareAtPrice);
    console.log('Selected variant:', selectedVariant);
    console.log('Product price range:', shopifyProductData?.priceRange);
    console.log('Description exists:', !!shopifyProductData?.descriptionHtml);
  }, [selectedVariant, shopifyProductData]);

  return (
    <Section theme="dark" spacing="none" full>
      <div className={styles.section}>

        {/* LEFT – Gallery */}
        <div className={styles.gallery}>
          <Gallery
            featureMedia={sanityProductData?.featureMedia}
            gallery={sanityProductData?.gallery}
            images={shopifyProductData?.images?.edges?.map(({ node }) => node)}
          />
        </div>

        {/* RIGHT – Product details */}
        <div className={styles.container}>
          <div className={styles.containerSticky}>
            <Container>
              <div id="details" className={styles.detailsRight}>

                {/* Title + Price */}
                <div className={styles.header}>
                  <Text size="b2" text={sanityProductData.store.title} />
                  {/* <Price 
                    price={price} 
                    compareAtPrice={compareAtPrice} 
                  /> */}
                </div>

                {/* Description + Size guide */}
                <Description
                  title={sanityProductData.store.title}
                  descriptionHtml={shopifyProductData?.descriptionHtml}
                  sanitySizeGuide={sanitySizeGuide}
                  collections={shopifyProductData?.collections}
                />

                {/* Purchase */}
                <Form
                  currencyCode={
                    shopifyProductData?.priceRange?.minVariantPrice?.currencyCode || "USD"
                  }
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