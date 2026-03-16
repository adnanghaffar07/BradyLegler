import { sanityFetch } from '../lib/fetch';
import { PRODUCT_INQUIRY_FLAGS_QUERY } from '../lib/queries.groq';

type ProductInquiryFlag = {
  handle: string;
  inquireButtonEnabled?: boolean;
  inquireButtonLabel?: string;
  inquirePriceText?: string;
};

/**
 * Fetches inquiry button flags for multiple products by their handles
 * Useful for batch fetching data for product cards that use shopifyProduct
 */
export async function getProductInquiryFlags(
  handles: string[]
): Promise<Record<string, ProductInquiryFlag>> {
  if (!handles || handles.length === 0) {
    return {};
  }

  const results = await sanityFetch<ProductInquiryFlag[]>({
    query: PRODUCT_INQUIRY_FLAGS_QUERY,
    params: { handles },
    tags: ['product', 'inquiry']
  });

  const flagsMap: Record<string, ProductInquiryFlag> = {};
  results.forEach(flag => {
    flagsMap[flag.handle] = flag;
  });

  return flagsMap;
}

/**
 * Fetches inquiry button flag for a single product by handle
 */
export async function getProductInquiryFlag(handle: string): Promise<ProductInquiryFlag | null> {
  if (!handle) {
    return null;
  }

  const results = await sanityFetch<ProductInquiryFlag[]>({
    query: PRODUCT_INQUIRY_FLAGS_QUERY,
    params: { handles: [handle] },
    tags: ['product', 'inquiry']
  });

  return results && results.length > 0 ? results[0] : null;
}
