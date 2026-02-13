'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';
import Button from '@/components/Button';
import Text from '@/components/Text';
import QuoteOverlay from './components/QuoteOverlay';
import Layout from '@/components/Layout';
import useCollectionFilters from './hooks/useCollectionFilters';
import {
  GetCollectionByHandleResponse,
  GetCollectionFiltersByHandleResponse,
  GetCollectionSubCollectionFiltersByIdResponse
} from '@/tools/apis/shopify';
import { ICollectionDocument } from '@/tools/sanity/schema/documents/collection';
import type { LayoutOption } from './components/LayoutOptions';
import styles from './styles.module.scss';

const ProductsGridClient = ({
  initialData,
  initialProductCount,
  sanityCollectionData,
  filters,
  subCollectionFilters,
  sectionsMiddle
}: {
  initialData: GetCollectionByHandleResponse;
  sanityCollectionData: ICollectionDocument;
  initialProductCount: number;
  filters: GetCollectionFiltersByHandleResponse;
  subCollectionFilters: GetCollectionSubCollectionFiltersByIdResponse;
  sectionsMiddle?: React.ReactNode;
}) => {
  const { shopifyCollectionData, productCount } = useCollectionFilters({
    initialData,
    initialProductCount,
    filters,
    collectionSlug: sanityCollectionData.store.slug.current
  });

  const layoutType = sanityCollectionData?.layout || 'fluidAndGrid';
  const layout: LayoutOption = 'grid';
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const numVisibleProducts = shopifyCollectionData?.products?.edges?.length || 0;

  const nextPage = () => {
    const params = new URLSearchParams(searchParams);
    const page = parseInt(params.get('page') || '1');
    params.set('page', (page + 1).toString());
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const layoutVariant = layoutType === 'list' ? 'list' : 'grid';

  const renderItems = useMemo(() => {
    const items: React.ReactNode[] = [];

    shopifyCollectionData?.products?.edges?.forEach(({ node }) => {
      items.push(
        <ProductCard
          key={node?.id}
          shopifyProduct={node}
          layoutType={layoutType}
          className={styles.productCard}
          overlayDetailsOnMobile={false}
          collectionId={sanityCollectionData?.store?.id}
          collectionTitle={sanityCollectionData?.store?.title}
        />
      );
    });

    return items;
  }, [sanityCollectionData, layoutType, shopifyCollectionData]);

  const hasProducts = shopifyCollectionData?.products?.edges?.length ? 
    shopifyCollectionData.products.edges.length > 0 : false;
  const productsCount = shopifyCollectionData?.products?.edges?.length || 0;

  return (
    <>
      {productsCount === 0 && (
        <div className={styles.noProducts}>
          <Text text="No products found" size="b2" />
        </div>
      )}
      
      {/* Product Grid - Always just products */}
      {hasProducts && (
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
      )}

         {/* Load More Section */}
      {numVisibleProducts < productCount && (
        <div className={styles.loadMoreContainer}>
          <Button variant="square" onClick={nextPage}>
            Load More
          </Button>
          <Text text={`Showing ${numVisibleProducts}/${productCount}`} size="b3" />
        </div>
      )}
      
      {/* Middle Sections - Always rendered BELOW the product grid */}
      {sectionsMiddle && hasProducts && (
        <div className={styles.middleSections}>
          {sectionsMiddle}
        </div>
      )}
      
   
    </>
  );
};

export default ProductsGridClient;