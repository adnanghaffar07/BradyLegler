'use client';

import { Suspense } from 'react';
import Text from '@/components/Text';
import ProductsGridClient from './ProductsGridClient';
import FiltersDrawer from './components/Filters';
import {
  GetCollectionByHandleResponse,
  GetCollectionFiltersByHandleResponse,
  GetCollectionSubCollectionFiltersByIdResponse
} from '@/tools/apis/shopify';
import { ICollectionDocument } from '@/tools/sanity/schema/documents/collection';
import styles from './styles.module.scss';

const ProductsGrid = ({
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
  const productCount = initialProductCount;

  return (
    <>
      {/* Only show filters if there are products */}
      {productCount > 0 && (
        <Suspense fallback={<div style={{ height: '40px' }} />}>
          <FiltersDrawer filters={filters} subCollectionFilters={subCollectionFilters} productCount={productCount} />
        </Suspense>
      )}

      <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
        <ProductsGridClient
          initialData={initialData}
          initialProductCount={initialProductCount}
          sanityCollectionData={sanityCollectionData}
          filters={filters}
          subCollectionFilters={subCollectionFilters}
          sectionsMiddle={sectionsMiddle}
        />
      </Suspense>
    </>
  );
};

export default ProductsGrid;
