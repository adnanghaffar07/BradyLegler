'use client';

import React, { useMemo, useState } from 'react';
import Section from '@/components/Section';
import Description from '../Description';
import Gallery from '../Gallery';
import Text from '@/components/Text';
import Form from '../Form';
import Container from '@/components/Container';
import Link from '@/components/Link';
import { GetProductByHandleResponse } from '@/tools/apis/shopify';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import { getFilteredSizeGuideTables } from '../SizeGuide/utils';
import { isRingProduct } from '@/lib/ringSizes';
import SubwayRingImage from '../SubwayRingCustomizer/SubwayRingImage';
import SubwayRingControls from '../SubwayRingCustomizer/SubwayRingControls';
import {
  SideKey,
  Metal,
  SideConfiguration,
  DEFAULT_METAL,
  DEFAULT_SIDE_ONE_FINISH,
  DEFAULT_SIDE_TWO_FINISH,
  buildCartAttributes
} from '../SubwayRingCustomizer/constants';
import styles from './styles.module.scss';

// Pilot: the customizable-image flow only applies to this one product for now, per the
// client's request - not the full catalog. Match by handle so nothing else is affected.
const CUSTOMIZABLE_PRODUCT_HANDLES = ['subway-double-band-ring-yellow-gold'];

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
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeSide, setActiveSide] = useState<SideKey>('sideOne');
  const [sideOneConfig, setSideOneConfig] = useState<SideConfiguration>({
    metal: DEFAULT_METAL,
    finish: DEFAULT_SIDE_ONE_FINISH
  });
  const [sideTwoConfig, setSideTwoConfig] = useState<SideConfiguration>({
    metal: DEFAULT_METAL,
    finish: DEFAULT_SIDE_TWO_FINISH
  });

  const handleSideChange = (side: SideKey, configuration: SideConfiguration) => {
    if (side === 'sideOne') setSideOneConfig(configuration);
    else setSideTwoConfig(configuration);
  };

  // It is one piece of metal, so the metal choice applies to both faces at once.
  const handleMetalChange = (metal: Metal) => {
    setSideOneConfig(previous => ({ ...previous, metal }));
    setSideTwoConfig(previous => ({ ...previous, metal }));
  };

  const isCustomizable = CUSTOMIZABLE_PRODUCT_HANDLES.includes(sanityProductData?.store?.slug?.current || '');

  const productCollectionIds = shopifyProductData?.collections?.edges?.map(edge => edge.node.id) || [];
  const ringCollections =
    shopifyProductData?.collections?.edges?.map(edge => ({ handle: edge.node.handle })) || [];
  const isRing = useMemo(
    () =>
      isRingProduct({
        productType: sanityProductData.store?.productType,
        tags: sanityProductData.store?.tags,
        collections: ringCollections
      }),
    [sanityProductData.store?.productType, sanityProductData.store?.tags, ringCollections]
  );
  const hasSizeGuide = useMemo(
    () =>
      getFilteredSizeGuideTables(
        (Array.isArray(sanitySizeGuide?.tables) ? sanitySizeGuide.tables : []) as Parameters<
          typeof getFilteredSizeGuideTables
        >[0],
        productCollectionIds
      ).length > 0,
    [sanitySizeGuide?.tables, productCollectionIds]
  );

  return (
    <Section theme="dark" spacing="none" full>
      <div className={styles.section}>
        {/* Left Column - Collection Info */}
        {primaryCollection?.store && (
          <div className={styles.leftColumn}>
            <div className={styles.collectionInfoLeft}>
              <div className={styles.collectionHeaderLeft}>
                {primaryCollection.store.title && primaryCollection.store.slug?.current && (
                  <Link href={`/${primaryCollection.store.slug.current}`} className={styles.collectionNameLink}>
                    <Text size="b2" className={styles.collectionNameLeft}>
                      {primaryCollection.store.title}
                    </Text>
                  </Link>
                )}
                {primaryCollection.store.title && !primaryCollection.store.slug?.current && (
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
          {isCustomizable ? (
            <SubwayRingImage activeSide={activeSide} sideOne={sideOneConfig} sideTwo={sideTwoConfig} />
          ) : (
            <Gallery
              featureMedia={sanityProductData?.featureMedia}
              gallery={sanityProductData?.gallery}
              images={shopifyProductData?.images?.edges?.map(({ node }) => node)}
            />
          )}
        </div>

        {/* Right Column - Product Details */}
        <div className={styles.rightColumn}>
          <div className={styles.containerStickyRight}>
            <div id="details" className={styles.detailsRightSection}>
              <div className={styles.headerRight}>
                <h1>{sanityProductData.store.title}</h1>
              </div>

              <div className={styles.productDescriptionRight}>
                <Description
                  sanitySizeGuide={sanitySizeGuide}
                  descriptionHtml={shopifyProductData?.descriptionHtml}
                  collections={shopifyProductData?.collections}
                  sizeGuideOpen={sizeGuideOpen}
                  onSizeGuideOpenChange={setSizeGuideOpen}
                />
              </div>

              {isCustomizable && (
                <SubwayRingControls
                  currencyCode={shopifyProductData?.priceRange?.minVariantPrice?.currencyCode || 'USD'}
                  activeSide={activeSide}
                  sideOne={sideOneConfig}
                  sideTwo={sideTwoConfig}
                  onActiveSideChange={setActiveSide}
                  onSideChange={handleSideChange}
                  onMetalChange={handleMetalChange}
                />
              )}

              <Form
                currencyCode={shopifyProductData?.priceRange?.minVariantPrice?.currencyCode || 'USD'}
                sanityProductData={sanityProductData}
                onOpenSizeGuide={() => setSizeGuideOpen(true)}
                showSizeChartLink={hasSizeGuide}
                isRing={isRing}
                hidePrice={isCustomizable}
                cartLineAttributes={
                  isCustomizable
                    ? buildCartAttributes({ sideOne: sideOneConfig, sideTwo: sideTwoConfig })
                    : undefined
                }
              />
            </div>
          </div>
        </div>

        {/* Mobile Divider - Only visible on mobile between product details and collection info */}
        {/* {primaryCollection?.store && (
          <div className={styles.mobileDivider}></div>
        )} */}
      </div>
    </Section>
  );
};

export default Details;