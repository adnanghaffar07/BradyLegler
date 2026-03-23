'use client';

import { useMemo, useState, useEffect, createElement, memo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import Text from '@/components/Text';
import QuoteOverlay from './components/QuoteOverlay';
import Layout from '@/components/Layout';
import useCollectionFilters from './hooks/useCollectionFilters';
import { useProductInquiryFlags } from '@/tools/hooks/useProductInquiryFlags';
import * as sectionsLibrary from '@/sections';
import * as string from '@/tools/helpers/string';
import {
  GetCollectionByHandleResponse,
  GetCollectionFiltersByHandleResponse,
  GetCollectionSubCollectionFiltersByIdResponse
} from '@/tools/apis/shopify';
import { ICollectionDocument } from '@/tools/sanity/schema/documents/collection';
import type { LayoutOption } from './components/LayoutOptions';
import styles from './styles.module.scss';

interface SectionLibrary {
  [key: string]: React.ComponentType<any>;
}

const ProductsGridClient = ({
  initialData,
  initialProductCount,
  sanityCollectionData,
  filters,
  subCollectionFilters,
  sectionsMiddleData
}: {
  initialData: GetCollectionByHandleResponse;
  sanityCollectionData: ICollectionDocument;
  initialProductCount: number;
  filters: GetCollectionFiltersByHandleResponse;
  subCollectionFilters: GetCollectionSubCollectionFiltersByIdResponse;
  sectionsMiddleData?: any[];
}) => {
  const { shopifyCollectionData, productCount } = useCollectionFilters({
    initialData,
    initialProductCount,
    filters,
    collectionSlug: sanityCollectionData.store.slug.current
  });

  const [handles, setHandles] = useState<string[]>([]);
  const { flags } = useProductInquiryFlags(handles);

  const layoutType = sanityCollectionData?.layout || 'fluidAndGrid';
  const layout: LayoutOption = 'grid';
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const numVisibleProducts = shopifyCollectionData?.products?.edges?.length || 0;

  // Update handles whenever products change
  useEffect(() => {
    const productHandles = shopifyCollectionData?.products?.edges?.map(({ node }) => node?.handle).filter(Boolean) || [];
    setHandles(productHandles);
  }, [shopifyCollectionData?.products?.edges]);

  const nextPage = () => {
    const params = new URLSearchParams(searchParams);
    const page = parseInt(params.get('page') || '1');
    params.set('page', (page + 1).toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const layoutVariant = layoutType === 'list' ? 'list' : 'grid';

  // Render a section component dynamically
  const renderSection = (section: any, sectionIndex: number) => {
    if (!section) return null;
    const { _key: key, _type: type, ...sectionProps } = section;
    const sectionMap: { [key: string]: string } = {
      homeCollections: 'HomeCollectionsSection',
      headerHeroSection: 'HeaderHeroSection',
      fullscreenImageSection: 'FullscreenImageSection',
      spacerSection: 'SpacerSection'
    };
    const sectionType = sectionMap[type] || string.toCapitalise(type);
    const sectionComponent = (sectionsLibrary as SectionLibrary)[sectionType];

    if (sectionComponent) {
      return createElement(sectionComponent, {
        key: `${sectionIndex}-${key}`,
        ...sectionProps
      });
    }
    return null;
  };

const renderItems = useMemo(() => {
  const items: React.ReactNode[] = [];
  const currentPageProducts = shopifyCollectionData?.products?.edges?.length || 0;
  const totalProducts = productCount; // Use total product count for calculations
  
  // Grid column count (for alignment)
  const GRID_COLUMNS = 4;
  
  // Only process middle sections if there are more than 7 products total
  const shouldProcessMiddleSections = totalProducts > 7 && layoutType === 'fluidAndGrid' && sectionsMiddleData?.length;
  
  // Parse sections by position - if no position specified, default to 'default' (after 8 products)
  const sectionsByPosition = shouldProcessMiddleSections ? {
    top: (sectionsMiddleData || []).filter(s => s?.sectionFields?.gridPosition === 'top'),
    middle: (sectionsMiddleData || []).filter(s => s?.sectionFields?.gridPosition === 'middle'),
    bottom: (sectionsMiddleData || []).filter(s => s?.sectionFields?.gridPosition === 'bottom'),
    default: (sectionsMiddleData || []).filter(s => !s?.sectionFields?.gridPosition)
  } : { top: [], middle: [], bottom: [], default: [] };

  // Calculate insertion indices based on TOTAL product count percentages
  // Align to complete grid rows (multiples of GRID_COLUMNS)
  const topPercentIndex = Math.round(totalProducts * 0.25) - 1;
  const middlePercentIndex = Math.round(totalProducts * 0.5) - 1;
  const bottomPercentIndex = Math.round(totalProducts * 0.75) - 1;
  
  // Align to nearest complete row (round to nearest multiple of GRID_COLUMNS)
  const topInsertIndex = Math.round(topPercentIndex / GRID_COLUMNS) * GRID_COLUMNS - 1;
  const middleInsertIndex = Math.round(middlePercentIndex / GRID_COLUMNS) * GRID_COLUMNS - 1;
  const bottomInsertIndex = Math.round(bottomPercentIndex / GRID_COLUMNS) * GRID_COLUMNS - 1;
  const defaultInsertIndex = 7; // After 8 products (index 7)

  shopifyCollectionData?.products?.edges?.forEach(({ node }, index) => {
    items.push(
      <ProductCard
        key={node?.id}
        shopifyProduct={node}
        layoutType={layoutType}
        className={styles.productCard}
        overlayDetailsOnMobile={false}
        collectionId={sanityCollectionData?.store?.id}
        collectionTitle={sanityCollectionData?.store?.title}
        inquiryEnabled={flags[node?.handle]?.inquireButtonEnabled}
        inquirePriceText={flags[node?.handle]?.inquirePriceText}
      />
    );

    // Insert top sections after 25% of total products (aligned to grid rows)
    if (shouldProcessMiddleSections && index === topInsertIndex && sectionsByPosition.top.length > 0) {
      sectionsByPosition.top.forEach((section, sectionIndex) => {
        items.push(
          <div key={`middle-sections-top-${sectionIndex}`} className={styles.middleSections} data-position="top">
            {renderSection(section, sectionIndex)}
          </div>
        );
      });
    }

    // Insert middle sections after 50% of total products (aligned to grid rows)
    if (shouldProcessMiddleSections && index === middleInsertIndex && sectionsByPosition.middle.length > 0) {
      sectionsByPosition.middle.forEach((section, sectionIndex) => {
        items.push(
          <div key={`middle-sections-middle-${sectionIndex}`} className={styles.middleSections} data-position="middle">
            {renderSection(section, sectionIndex)}
          </div>
        );
      });
    }

    // Insert bottom sections after 75% of total products (aligned to grid rows)
    if (shouldProcessMiddleSections && index === bottomInsertIndex && sectionsByPosition.bottom.length > 0) {
      sectionsByPosition.bottom.forEach((section, sectionIndex) => {
        items.push(
          <div key={`middle-sections-bottom-${sectionIndex}`} className={styles.middleSections} data-position="bottom">
            {renderSection(section, sectionIndex)}
          </div>
        );
      });
    }

    // Insert default sections after 8 products (index 7) - for sections without position specified
    if (shouldProcessMiddleSections && index === defaultInsertIndex && sectionsByPosition.default.length > 0) {
      sectionsByPosition.default.forEach((section, sectionIndex) => {
        items.push(
          <div key={`middle-sections-default-${sectionIndex}`} className={styles.middleSections} data-position="default">
            {renderSection(section, sectionIndex)}
          </div>
        );
      });
    }
  });

  return items;
}, [layout, sanityCollectionData, sectionsMiddleData, layoutType, shopifyCollectionData, layoutVariant, flags, productCount]);

// Determine if this is a small collection that needs sections after the grid
const isSmallCollection = productCount <= 7;
const shouldShowMiddleAfterGrid = sectionsMiddleData?.length && 
  layoutType === 'fluidAndGrid' && 
  isSmallCollection;

return (
  <>
    {shopifyCollectionData?.products?.edges?.length === 0 && (
      <div className={styles.noProducts}>
        <Text text="No products found" size="b2" />
      </div>
    )}
    
    <Layout 
      variant={layoutVariant} 
      id="bl-collection-grid"
      className={numVisibleProducts <= 2 ? styles.centeredGrid : ''}
    >
      <QuoteOverlay
        quote={sanityCollectionData?.quote}
        show={layoutType === 'list'}
        itemsCount={renderItems.length}
      />
      {renderItems}
    </Layout>

    {/* Render middle sections AFTER the grid for small collections */}
    {shouldShowMiddleAfterGrid && (
      <div className={styles.middleSectionsAfterGrid}>
        {(sectionsMiddleData || []).map((section, index) => (
          <div key={`after-grid-${index}`} data-position="after-grid">
            {renderSection(section, index)}
          </div>
        ))}
      </div>
    )}

    {numVisibleProducts < productCount && (
      <div className={styles.loadMoreContainer}>
        <Button variant="square" onClick={nextPage}>
          Load More
        </Button>
        <Text text={`Showing ${numVisibleProducts}/${productCount}`} size="b3" />
      </div>
    )}
  </>
  );
};

export default ProductsGridClient;