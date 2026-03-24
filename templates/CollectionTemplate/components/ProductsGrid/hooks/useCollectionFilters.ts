'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { sanityFetch } from '@/tools/sanity/lib/fetchFromSection';
import { ARTWORKS_QUERY, PRODUCTS_QUERY } from '@/tools/sanity/lib/queries.groq';
import {
  getCollectionByHandle,
  GetCollectionByHandleResponse,
  GetCollectionByHandleSortBy,
  GetCollectionFiltersByHandleResponse,
  getCollectionProductCountByHandle
} from '@/tools/apis/shopify';

/**
 * useCollectionFilters - OPTIMIZED
 *
 * Performance optimizations:
 * 1. Caches enriched product data (with collectionMedia already merged)
 * 2. Request deduplication - prevents duplicate simultaneous API calls
 * 3. Smarter cache validation - compares actual param values, not object references
 * 4. Minimal Sanity fetches - only when truly needed
 *
 */

interface CachedPageData {
  data: GetCollectionByHandleResponse;
  timestamp: number;
}

const useCollectionFilters = ({
  initialData,
  initialProductCount,
  filters,
  collectionSlug
}: {
  initialData: GetCollectionByHandleResponse;
  initialProductCount: number;
  filters: GetCollectionFiltersByHandleResponse;
  collectionSlug: string;
}): {
  shopifyCollectionData: GetCollectionByHandleResponse;
  productCount: number;
} => {
  const searchParams = useSearchParams();
  const [shopifyCollectionData, setShopifyCollectionData] = useState(initialData);
  const [productCount, setProductCount] = useState(initialProductCount);
  
  // Track last params to prevent unnecessary effect runs
  const lastParamsRef = useRef<string>('');
  
  // Cache for fetched & enriched pages (7 min TTL)
  const enrichedPageCache = useRef<Map<string, CachedPageData>>(new Map());
  const productCountCache = useRef<Map<string, number>>(new Map());
  const CACHE_TTL = 7 * 60 * 1000;
  
  // Request deduplication - prevent duplicate simultaneous requests
  const pendingRequests = useRef<Map<string, Promise<any>>>(new Map());

  const getCacheKey = (filterKey: string, page: number, sortBy: string) => {
    return `${filterKey}-p${page}-${sortBy}`;
  };

  const getFilterCacheKey = (filterKey: string) => {
    return filterKey;
  };

  useEffect(() => {
    async function fetchShopifyCollectionData(selectedFiltersParsed: any[], page: number, sortBy: string) {
      return await getCollectionByHandle(collectionSlug, page, selectedFiltersParsed, sortBy);
    }

    async function fetchProductCount(selectedFiltersParsed: any[]) {
      return await getCollectionProductCountByHandle(collectionSlug, selectedFiltersParsed);
    }

    async function enrichProductsWithSanity(products: any[]) {
      const productIds = products?.map(({ node }) => node?.id)?.filter(Boolean);
      if (!Array.isArray(productIds) || productIds.length === 0) return products;

      try {
        const sanityProductData = await sanityFetch<{ id: string; collectionMedia: any }[]>({
          query: PRODUCTS_QUERY,
          params: { productIds }
        });

        return products?.map(({ node }) => {
          const sanityProduct = sanityProductData.find(({ id }) => id === node.id);
          return {
            node: {
              ...node,
              ...(sanityProduct?.collectionMedia ? { collectionMedia: sanityProduct.collectionMedia } : {})
            }
          };
        });
      } catch (error) {
        console.error('Sanity enrichment failed, using raw data:', error);
        return products;
      }
    }

    // Enrich products in background without blocking render
    const enrichInBackground = async (products: any[], cacheKey: string) => {
      const enrichedEdges = await enrichProductsWithSanity(products);
      
      // Update cache with enriched data
      const cached = enrichedPageCache.current.get(cacheKey);
      if (cached) {
        enrichedPageCache.current.set(cacheKey, {
          ...cached,
          data: {
            ...cached.data,
            products: { edges: enrichedEdges }
          }
        });
        // Trigger state update with enriched data if still relevant
        setShopifyCollectionData(prev => 
          prev.products?.edges === products
            ? { ...prev, products: { edges: enrichedEdges } }
            : prev
        );
      }
    };

    async function fetchData() {
      const params = new URLSearchParams(searchParams);
      const selectedFilterIds: string[] = [];
      
      for (const [key, value] of params) {
        if (key.split('.')?.[0] !== 'filter') continue;
        selectedFilterIds.push(`${key}.${value}`);
      }
      
      const selectedFilters = selectedFilterIds.map(id => {
        const filterMatch = filters?.find(filter => filter.values.some(value => value.id === id));
        return filterMatch?.values.find(value => value.id === id)?.input || '';
      });
      
      const selectedFiltersParsed = selectedFilters
        ?.map(filter => {
          try {
            return JSON.parse(filter);
          } catch (error) {
            return undefined;
          }
        })
        .filter(Boolean);

      // Always fetch ALL products at once instead of paginating
      // Calculate page number needed to fetch all available products
      const sortBy = (params.get('sort_by') || 'best-selling') as GetCollectionByHandleSortBy;
      const filterKey = selectedFilterIds.join('|');
      const filterCacheKey = getFilterCacheKey(filterKey);
      
      // Build param signature to detect changes (excluding page since we no longer paginate)
      const paramSignature = `${filterKey}|${sortBy}`;
      
      // Skip if params haven't changed since last effect
      if (lastParamsRef.current === paramSignature) return;
      lastParamsRef.current = paramSignature;

      const now = Date.now();
      // Use a constant cache key since we're always loading all products
      const cacheKey = `${filterKey}-all-${sortBy}`;
      const cachedPage = enrichedPageCache.current.get(cacheKey);

      // Return cached enriched data if valid
      if (cachedPage && now - cachedPage.timestamp < CACHE_TTL) {
        setShopifyCollectionData(cachedPage.data);
        const cachedCount = productCountCache.current.get(filterCacheKey);
        if (cachedCount !== undefined) setProductCount(cachedCount);
        return;
      }

      // Check for pending request (deduplication)
      const existingRequest = pendingRequests.current.get(cacheKey);
      if (existingRequest) {
        try {
          const result = await existingRequest;
          setShopifyCollectionData(result.data);
          setProductCount(result.count);
        } catch (error) {
          console.error('Pending request failed:', error);
        }
        return;
      }

      // Create new request promise for deduplication
      const requestPromise = (async () => {
        try {
          // Fetch product count with current filters first
          const newProductCount = await fetchProductCount(selectedFiltersParsed);
          
          // Calculate page number to fetch all products
          // (perPage is 8, so page = ceil(count / 8))
          const pageNeededForAll = Math.ceil(newProductCount / 8);
          
          // Fetch all products with calculated page
          const newShopifyCollectionData = await fetchShopifyCollectionData(
            selectedFiltersParsed, 
            pageNeededForAll, 
            sortBy
          );

          // Display product data immediately without waiting for Sanity enrichment
          const rawData = {
            ...newShopifyCollectionData,
            products: {
              edges: newShopifyCollectionData?.products?.edges || []
            }
          };

          // Cache raw result
          enrichedPageCache.current.set(cacheKey, {
            data: rawData,
            timestamp: now
          });
          productCountCache.current.set(filterCacheKey, newProductCount);

          // Set state immediately with raw data (fast render)
          setShopifyCollectionData(rawData);
          setProductCount(newProductCount);

          // Enrich in background (non-blocking) - starts after render
          if (newShopifyCollectionData?.products?.edges?.length > 0) {
            setTimeout(() => {
              enrichInBackground(newShopifyCollectionData.products.edges, cacheKey);
            }, 0);
          }

          return { data: rawData, count: newProductCount };
        } finally {
          // Remove from pending requests
          pendingRequests.current.delete(cacheKey);
        }
      })();

      pendingRequests.current.set(cacheKey, requestPromise);
      await requestPromise;
    }

    fetchData();
  }, [searchParams, filters, collectionSlug]);

  return {
    shopifyCollectionData,
    productCount
  };
};

export default useCollectionFilters;
