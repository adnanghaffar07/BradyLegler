/**
 * Meta Tracking Helper Functions and Examples
 *
 * This file provides practical examples and helper functions for implementing
 * Meta Pixel tracking throughout the storefront.
 */

import { trackViewContent, trackAddToCart, trackInitiateCheckout } from '@/lib/meta';

/**
 * Product Page Tracking
 *
 * Usage in your product page component:
 * ```tsx
 * import { useMetaProductTracking } from '@/tools/helpers/metaTracking'
 *
 * export default function ProductPage({ product }) {
 *   useMetaProductTracking(product)
 *   // ... rest of component
 * }
 * ```
 */

interface Product {
  id: string;
  title: string;
  price: number;
  currency?: string;
  handle?: string;
}

interface ShopifyProduct extends Product {
  shopifyId: string;
  priceRange?: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
}

/**
 * Hook to track product view
 * Call in useEffect(() => { ... }, [productId])
 */
export function trackProductView(product: Product): void {
  if (!product.id || !product.title) {
    console.warn('[Meta] Missing required product data:', product);
    return;
  }

  const price = parseFloat(String(product.price));
  const currency = product.currency || 'USD';

  trackViewContent({
    content_ids: [product.id],
    content_name: product.title,
    value: price,
    currency: currency,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta] Product view tracked:', {
      id: product.id,
      title: product.title,
      price,
      currency,
    });
  }
}

/**
 * Cart Line Item Tracking
 *
 * Track when user adds item to cart. Call this AFTER successful add.
 */
export function trackCartAddition(
  product: Product,
  quantity: number = 1
): void {
  if (!product.id || !product.title) {
    console.warn('[Meta] Missing required product data:', product);
    return;
  }

  const price = parseFloat(String(product.price)) * quantity;
  const currency = product.currency || 'USD';

  trackAddToCart({
    content_ids: [product.id],
    content_name: product.title,
    value: price,
    currency: currency,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta] Cart addition tracked:', {
      id: product.id,
      title: product.title,
      quantity,
      totalPrice: price,
      currency,
    });
  }
}

/**
 * Checkout Initiation
 *
 * Call when user clicks "Proceed to Checkout"
 * This sends browser event only - Shopify handles the rest
 */
export function handleCheckoutInitiation(checkoutUrl: string): void {
  // Track browser event (Shopify will handle CAPI via native integration)
  trackInitiateCheckout();

  if (process.env.NODE_ENV === 'development') {
    console.log('[Meta] Checkout initiated, redirecting to:', checkoutUrl);
  }

  // Redirect to Shopify checkout
  setTimeout(() => {
    window.location.href = checkoutUrl;
  }, 100);
}

/**
 * Multiple Products in Cart
 *
 * For multi-item cart additions or bulk operations
 */
export function trackMultipleCartAdditions(
  products: Product[],
  quantities: Record<string, number>
): void {
  products.forEach((product) => {
    const quantity = quantities[product.id] || 1;
    trackCartAddition(product, quantity);
  });
}

/**
 * Shopify Product Conversion
 *
 * Convert Shopify product format to our tracking format
 */
export function convertShopifyProduct(shopifyProduct: any): Product {
  const priceString = shopifyProduct.priceRange?.minVariantPrice?.amount ||
    shopifyProduct.price ||
    '0';
  const currency = shopifyProduct.priceRange?.minVariantPrice?.currencyCode ||
    'USD';

  return {
    id: shopifyProduct.id || shopifyProduct.handle || '',
    title: shopifyProduct.title || '',
    price: parseFloat(String(priceString)),
    currency: currency,
    handle: shopifyProduct.handle,
  };
}

/**
 * Product View from Sanity
 *
 * If pulling products from Sanity instead of Shopify
 */
export function trackSanityProductView(sanityProduct: any): void {
  const product: Product = {
    id: sanityProduct._id || sanityProduct.slug || '',
    title: sanityProduct.title || sanityProduct.name || '',
    price: sanityProduct.price || 0,
    currency: sanityProduct.currency || 'USD',
  };

  trackProductView(product);
}

/**
 * Example: Product Page Component
 *
 * ```tsx
 * 'use client'
 *
 * import { useEffect } from 'react'
 * import { trackProductView } from '@/tools/helpers/metaTracking'
 * import { getProduct } from '@/tools/sanity/queries'
 *
 * export default function ProductPage({ params }) {
 *   const [product, setProduct] = useState(null)
 *
 *   useEffect(() => {
 *     const fetchProduct = async () => {
 *       const data = await getProduct(params.slug)
 *       setProduct(data)
 *       
 *       // Track view after data loads
 *       if (data) {
 *         trackProductView({
 *           id: data._id,
 *           title: data.title,
 *           price: data.price,
 *           currency: 'USD'
 *         })
 *       }
 *     }
 *     
 *     fetchProduct()
 *   }, [params.slug])
 *
 *   if (!product) return <div>Loading...</div>
 *
 *   return (
 *     <div>
 *       <h1>{product.title}</h1>
 *       <p>${product.price}</p>
 *       <AddToCartButton product={product} />
 *     </div>
 *   )
 * }
 * ```
 */

/**
 * Example: Add to Cart Button
 *
 * ```tsx
 * 'use client'
 *
 * import { useState } from 'react'
 * import { trackCartAddition } from '@/tools/helpers/metaTracking'
 * import { useCart } from '@/tools/hooks/useCart'
 *
 * export default function AddToCartButton({ product }) {
 *   const [loading, setLoading] = useState(false)
 *   const { addToCart } = useCart()
 *
 *   async function handleAddToCart() {
 *     setLoading(true)
 *     try {
 *       const result = await addToCart(product.id, 1)
 *       
 *       if (result.success) {
 *         // Track AFTER successful addition
 *         trackCartAddition(product, 1)
 *       } else {
 *         console.error('Failed to add to cart')
 *       }
 *     } finally {
 *       setLoading(false)
 *     }
 *   }
 *
 *   return (
 *     <button onClick={handleAddToCart} disabled={loading}>
 *       {loading ? 'Adding...' : 'Add to Cart'}
 *     </button>
 *   )
 * }
 * ```
 */

/**
 * Example: Checkout Button
 *
 * ```tsx
 * 'use client'
 *
 * import { handleCheckoutInitiation } from '@/tools/helpers/metaTracking'
 * import { useCart } from '@/tools/hooks/useCart'
 *
 * export default function CheckoutButton() {
 *   const { cart, checkoutUrl } = useCart()
 *
 *   function handleClick() {
 *     // This function:
 *     // 1. Tracks InitiateCheckout (browser only)
 *     // 2. Redirects to Shopify checkout
 *     // 3. Shopify handles Purchase event
 *     handleCheckoutInitiation(checkoutUrl)
 *   }
 *
 *   return (
 *     <button onClick={handleClick}>
 *       Proceed to Checkout
 *     </button>
 *   )
 * }
 * ```
 */

/**
 * Testing Utilities
 *
 * Use these in development/testing environments
 */

export const metaTestingUtils = {
  /**
   * Get all events fired in current session
   * (requires development logging enabled)
   */
  getSessionEvents(): Array<{ name: string; timestamp: number; data?: any }> {
    const sessionKey = '_meta_session_events';
    const stored = localStorage.getItem(sessionKey) || '[]';
    return JSON.parse(stored);
  },

  /**
   * Clear session event log
   */
  clearSessionEvents(): void {
    localStorage.removeItem('_meta_session_events');
  },

  /**
   * Log event to session storage
   */
  logEvent(name: string, data?: any): void {
    const sessionKey = '_meta_session_events';
    const events = this.getSessionEvents();
    events.push({
      name,
      timestamp: Date.now(),
      data,
    });
    localStorage.setItem(sessionKey, JSON.stringify(events));
  },

  /**
   * Simulate product view
   */
  simulateProductView(overrides?: Partial<Product>): void {
    const product: Product = {
      id: 'test-product-123',
      title: 'Test Product',
      price: 99.99,
      currency: 'USD',
      ...overrides,
    };
    trackProductView(product);
  },

  /**
   * Simulate add to cart
   */
  simulateAddToCart(overrides?: Partial<Product>): void {
    const product: Product = {
      id: 'test-product-456',
      title: 'Test Product 2',
      price: 49.99,
      currency: 'USD',
      ...overrides,
    };
    trackCartAddition(product, 1);
  },

  /**
   * Check if fbq is initialized
   */
  checkPixelInitialization(): boolean {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  },
};

/**
 * Export type for use in components
 */
export type { Product, ShopifyProduct };
