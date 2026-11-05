import { client } from '@/tools/sanity/lib/client';
import { SEARCH_PRODUCTS_QUERY } from '@/tools/sanity/lib/queries.groq';

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
    const products = await client.fetch<SearchProduct[]>(
      SEARCH_PRODUCTS_QUERY,
      {},
      { perspective: 'published', next: { revalidate } }
    );
    return Response.json(products ?? []);
  } catch (error) {
    console.error('Error building the search index:', error);
    return Response.json([], { status: 500 });
  }
}
