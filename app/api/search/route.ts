import { client } from '@/tools/sanity/lib/client';
import { SEARCH_PRODUCTS_QUERY } from '@/tools/sanity/lib/queries.groq';
import { getPublishedProductHandles } from '@/tools/apis/shopify';

export type SearchProduct = {
  title: string;
  handle: string;
  productType?: string | null;
  tags?: string | null;
  image?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inquireButtonEnabled?: boolean | null;
  inquirePriceText?: string | null;
};

// The catalogue changes rarely, so the index is rebuilt at most every five minutes.
export const revalidate = 300;

export async function GET() {
  try {
    const [products, liveHandles] = await Promise.all([
      client.fetch<SearchProduct[]>(SEARCH_PRODUCTS_QUERY, {}, { perspective: 'published', next: { revalidate } }),
      getPublishedProductHandles()
    ]);

    // Sanity can still mark a product active after it has gone back to draft in
    // Shopify, so only list what Shopify is actually selling. If Shopify cannot be
    // reached this throws and search shows its error state rather than risk listing
    // unpublished pieces.
    return Response.json((products ?? []).filter(product => liveHandles.has(product.handle)));
  } catch (error) {
    console.error('Error building the search index:', error);
    return Response.json([], { status: 500 });
  }
}
