'use client';

/**
 * ViewContent Tracker Component
 * 
 * Tracks when a user views a product page in Meta Pixel
 * This component must be client-side to use useEffect
 */

import { useEffect } from 'react';
import { trackViewContent } from '@/lib/meta';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';

interface ViewContentTrackerProps {
  product: IProductDocument | null;
  shopifyProduct?: any;
}

export const ViewContentTracker: React.FC<ViewContentTrackerProps> = ({ product, shopifyProduct }) => {
  useEffect(() => {
    if (!product?.store) {
      return;
    }

    const productData = product.store;
    const productId = productData.id || productData.slug?.current || '';
    const productTitle = productData.title || 'Unknown Product';
    
    // Get price from Shopify data if available
    let price = 0;
    if (shopifyProduct?.priceRange?.minVariantPrice?.amount) {
      price = parseFloat(shopifyProduct.priceRange.minVariantPrice.amount);
    } else if (productData.price) {
      price = parseFloat(String(productData.price));
    }

    const currency = productData.currency || shopifyProduct?.priceRange?.minVariantPrice?.currencyCode || 'USD';

    if (!productId || !productTitle) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Meta] ViewContent: Missing product data', { productId, productTitle });
      }
      return;
    }

    // Track ViewContent event
    trackViewContent({
      content_ids: [productId],
      content_name: productTitle,
      content_type: 'product',
      value: price,
      currency: currency,
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('[Meta] ViewContent tracked:', {
        productId,
        productTitle,
        price,
        currency,
      });
    }
  }, [product?.store?.id, product?.store?.title]); // Only re-track if product ID changes

  return null; // This component doesn't render anything
};
