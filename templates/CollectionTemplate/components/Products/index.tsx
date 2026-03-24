import React from 'react';
import Section from '@/components/Section';
import ProductsGrid from '../ProductsGrid';
import { ICollectionDocument } from '@/tools/sanity/schema/documents/collection';
import {
  getCollectionByHandle,
  getCollectionFiltersByHandle,
  getCollectionProductCountByHandle,
  getCollectionSubCollectionFiltersById
} from '@/tools/apis/shopify';
import { Analytics } from '@/tools/analytics';
import styles from './styles.module.scss';
import { sanityFetch } from '@/tools/sanity/lib/fetchFromSection';
import { PRODUCTS_QUERY } from '@/tools/sanity/lib/queries.groq';
import Sections from '@/components/Sections';

const Products = async ({
  sanityCollectionData,
  params,
  searchParams
}: {
  sanityCollectionData: ICollectionDocument;
  params?: { [key: string]: string } | undefined;
  searchParams: { [key: string]: string } | undefined;
}) => {
  const collectionSlug = sanityCollectionData?.store?.slug?.current;

  // ---- PARALLELIZE INITIAL SHOPIFY FETCHES ----
  // Fetch collection data, product count, and filters in parallel
  // Always fetch all products at once (no pagination) - use high page number to load all
  const [productCount, filters] = await Promise.all([
    getCollectionProductCountByHandle(collectionSlug),
    getCollectionFiltersByHandle(collectionSlug)
  ]);

  // Calculate page number to fetch all products (perPage=8, request enough to get all)
  // Shopify GraphQL typically caps at 250 items, so this ensures we get all available
  const pageNeededForAll = Math.ceil(productCount / 8);
  const initialData = await getCollectionByHandle(collectionSlug, pageNeededForAll);

  // ---- SAFE PRODUCT ID PARSING & FETCH SANITY DATA ----
  const productIds = initialData?.products?.edges?.map(edge => edge?.node?.id)?.filter(Boolean);

  // If no IDs → skip Sanity query completely
  let sanityProductData: any[] = [];

  if (Array.isArray(productIds) && productIds.length > 0) {
    // IMPORTANT: Make sure PRODUCTS_QUERY includes gallery
    sanityProductData = await sanityFetch({
      query: PRODUCTS_QUERY,
      params: { productIds }
    });
  }

  // ---- MERGE SANITY GALLERY IMAGES WITH SHOPIFY DATA ----
  const enrichedInitialDataEdges = initialData?.products?.edges?.map(edge => {
    const sanityProduct = sanityProductData.find(p => p.id === edge?.node?.id);

    // Create merged product object
    const mergedProduct = {
      ...(edge?.node || {}),
      // Add collectionMedia if it exists
      ...(sanityProduct?.collectionMedia ? { collectionMedia: sanityProduct.collectionMedia } : {}),
      // ADD THIS: Merge gallery images from Sanity
      ...(sanityProduct?.gallery ? { gallery: sanityProduct.gallery } : {})
    };

    return {
      node: mergedProduct
    };
  });

  const enrichedInitialData = {
    ...initialData,
    products: {
      edges: enrichedInitialDataEdges
    }
  };

  // ---- GET SUB-COLLECTION FILTERS (depends on initialData) ----
  const subCollectionFilters = await getCollectionSubCollectionFiltersById(initialData?.id);
  const tempTheme = params?.slug?.[0] === 'jewelry' ? 'dark' : 'dark';
  const currency = initialData?.products?.edges?.[0]?.node?.priceRange?.minVariantPrice?.currencyCode;
  const sectionsMiddleData = sanityCollectionData?.sectionsMiddle;

  return (
    <>
      <Analytics
        trackViewItemList={{
          items: initialData?.products?.edges?.map(({ node: product }, index) => ({
            id: product?.id,
            name: product?.title,
            category: product?.productType,
            price: product?.priceRange?.minVariantPrice?.amount,
            position: index + 1
          })),
          currency: currency,
          listName: sanityCollectionData.store.title,
          listId: sanityCollectionData.store.id
        }}
      />

      <Section className={styles.products} full removeTopSpacing removeBottomSpacing theme={tempTheme}>
        <ProductsGrid
          sanityCollectionData={sanityCollectionData}
          initialData={enrichedInitialData} // This now contains gallery images!
          initialProductCount={productCount}
          filters={filters}
          subCollectionFilters={subCollectionFilters}
          sectionsMiddleData={sectionsMiddleData}
        />
      </Section>
    </>
  );
};

export default Products;
