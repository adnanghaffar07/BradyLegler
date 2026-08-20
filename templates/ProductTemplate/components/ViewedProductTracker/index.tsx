'use client';

/**
 * Klaviyo Viewed Product Tracker
 *
 * Fires Klaviyo's "Viewed Product" metric (which Browse Abandonment flows trigger off of)
 * plus trackViewedItem (which populates the profile's recently-viewed product feed used by
 * Browse Abandonment emails and product recommendation blocks). Both are required - track()
 * alone fires the metric but leaves the "recently viewed" feed empty; trackViewedItem() alone
 * populates the feed but doesn't fire a metric a flow can trigger on. See
 * developers.klaviyo.com "Integrate a platform without a pre-built Klaviyo integration".
 */

import { useEffect } from 'react';
import { track, trackViewedItem } from '@/tools/klaviyo/client';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import { ShopifyProduct } from '@/tools/apis/shopify';

interface ViewedProductTrackerProps {
  product: IProductDocument | null;
  shopifyProduct?: ShopifyProduct | null;
}

export const ViewedProductTracker: React.FC<ViewedProductTrackerProps> = ({ product, shopifyProduct }) => {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const productData = product?.store;
    const firstVariant = shopifyProduct?.variants?.edges?.[0]?.node;
    const firstImage = shopifyProduct?.images?.edges?.[0]?.node;

    const productId = shopifyProduct?.id || productData?.id || '';
    const productName = shopifyProduct?.title || productData?.title || '';

    if (!productId || !productName) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Klaviyo] Viewed Product: missing product id/name, skipping', { productId, productName });
      }
      return;
    }

    const priceAmount = firstVariant?.priceV2?.amount ?? shopifyProduct?.priceRange?.minVariantPrice?.amount;
    const price = priceAmount !== undefined ? parseFloat(String(priceAmount)) : undefined;
    const categories = shopifyProduct?.productType ? [shopifyProduct.productType] : undefined;
    const url = window.location.href;
    const imageUrl = firstImage?.src;
    const sku = firstVariant?.sku;
    const brand = shopifyProduct?.vendor;

    track('Viewed Product', {
      ProductName: productName,
      ProductID: productId,
      SKU: sku,
      Categories: categories?.join(', '),
      ImageURL: imageUrl,
      URL: url,
      Brand: brand,
      Price: price
    });

    trackViewedItem({
      Title: productName,
      ItemId: productId,
      Categories: categories,
      ImageUrl: imageUrl,
      Url: url,
      Metadata: {
        Brand: brand,
        Price: price
      }
    });
  }, [product?.store?.id, shopifyProduct?.id]);

  return null;
};
