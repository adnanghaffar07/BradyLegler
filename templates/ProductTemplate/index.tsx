import Details from './components/Details';
import Sections from './components/Sections';
import { getCollectionByHandle, getProductByHandle, getProductRecommendations } from '@/tools/apis/shopify';
import { IProductDocument } from '@/tools/sanity/schema/documents/product';
import { sanityFetch } from '@/tools/sanity/lib/fetch';
import { SIZE_GUIDE_QUERY } from '@/tools/sanity/lib/queries.groq';
import { ISizeGuideDocument } from '@/tools/sanity/schema/documents/sizeGuideDocument';
import SplashScreen from '@/components/SplashScreen';
import { Analytics } from '@/tools/analytics';
import { groq } from 'next-sanity';
import Recommendations from './components/Recommendations';

interface WebPageProps extends PageProps {
  data: IProductDocument;
  setSelectedVariant?: (variant: any) => void;
}

interface CollectionData {
  store?: {
    title?: string;
    collectionStory?: string;
    slug?: { current?: string };
    imageUrl?: string;
    id?: string;
    descriptionHtml?: string;
  };
}

const ProductTemplate = async (props: WebPageProps) => {
  const { data, params, searchParams } = props;
  const sanityProductData = data;

  // Fetch Shopify product
  const shopifyProductData = sanityProductData?.store?.slug?.current
    ? await getProductByHandle(sanityProductData.store.slug.current)
    : null;

  console.log('=== PRODUCT COLLECTIONS DEBUG ===');
  const shopifyCollections = shopifyProductData?.collections?.edges?.map(e => ({
    id: e.node.id.replace('gid://shopify/Collection/', ''),
    title: e.node.title,
    handle: e.node.handle
  })) || [];

  console.log('Shopify collections:', shopifyCollections);

  // Define priority: Specific collections first
  const SPECIFIC_COLLECTIONS = [
    'subway', 'subway-collection',
    'bobby', 'centric', 'line', 'lucia', 'noir-collection',
    'nova', 'pencil', 'saturn-collection', 'wave', 'revel'
  ];

  let primaryCollection: CollectionData | null = null;

  // First, try to find specific collections
  for (const shopifyCollection of shopifyCollections) {
    if (SPECIFIC_COLLECTIONS.includes(shopifyCollection.handle)) {
      try {
        // CORRECTED QUERY: collectionStory is top-level
        const collection = await sanityFetch<any>({
          query: groq`
            *[_type == "collection" && store.slug.current == $handle][0]{
              collectionStory, // TOP LEVEL
              store {
                title,
                slug {
                  current
                },
                imageUrl,
                id,
                descriptionHtml
              }
            }
          `,
          params: { handle: shopifyCollection.handle },
          tags: ['collection']
        });

        console.log(`Fetched collection "${shopifyCollection.handle}":`, collection);

        if (collection?.store?.title) {
          primaryCollection = {
            store: {
              title: collection.store.title,
              collectionStory: collection.collectionStory, // From top level
              slug: collection.store.slug,
              imageUrl: collection.store.imageUrl,
              id: collection.store.id,
              descriptionHtml: collection.store.descriptionHtml
            }
          };
          console.log(`Selected specific collection: ${collection.store.title}`);
          console.log(`Collection story: "${collection.collectionStory}"`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching ${shopifyCollection.handle}:`, error);
      }
    }
  }

  // If no specific collection found, try any collection
  if (!primaryCollection && shopifyCollections.length > 0) {
    console.log('No specific collection found, trying any collection...');

    for (const shopifyCollection of shopifyCollections) {
      try {
        const collection = await sanityFetch<any>({
          query: groq`
            *[_type == "collection" && store.slug.current == $handle][0]{
              collectionStory,
              store {
                title,
                slug { current },
                imageUrl,
                id
              }
            }
          `,
          params: { handle: shopifyCollection.handle },
          tags: ['collection']
        });

        if (collection?.store?.title) {
          primaryCollection = {
            store: {
              title: collection.store.title,
              collectionStory: collection.collectionStory,
              slug: collection.store.slug,
              imageUrl: collection.store.imageUrl,
              id: collection.store.id
            }
          };
          console.log(`Selected collection: ${collection.store.title}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  console.log('=== FINAL PRIMARY COLLECTION ===');
  console.log('Title:', primaryCollection?.store?.title);
  console.log('Story:', primaryCollection?.store?.collectionStory);
  console.log('Full object:', primaryCollection);

  // Get recommendations from the same collection instead
  let shopifyProductRecommendations = [];
  
  if (primaryCollection?.store?.slug?.current) {
    try {
      // Fetch collection products
      const collection = await getCollectionByHandle(primaryCollection.store.slug.current, 1);
      
      if (collection?.products?.edges) {
        // Filter out the current product and take up to 3
        shopifyProductRecommendations = collection.products.edges
          .map(({ node }) => node)
          .filter(product => product.id !== shopifyProductData?.id) // Exclude current product
          .slice(0, 3);
      }
    } catch (error) {
      console.error('Error fetching collection for recommendations:', error);
    }
  }

  // Fallback to Shopify recommendations if no collection
  if (shopifyProductRecommendations.length === 0 && sanityProductData?.store?.gid) {
    shopifyProductRecommendations = await getProductRecommendations(sanityProductData.store.gid);
  }
  // Fetch size guide
  const sanitySizeGuide = await sanityFetch<ISizeGuideDocument>({
    query: SIZE_GUIDE_QUERY,
    tags: ['sizeGuideDocument']
  });

  return (
    <>
      {shopifyProductData && (
        <Analytics
          trackViewItem={{
            item: {
              id: shopifyProductData.id || '',
              name: shopifyProductData.title || '',
              category: shopifyProductData.productType || '',
              price: shopifyProductData.priceRange?.minVariantPrice?.amount || 0
            },
            currency: shopifyProductData.priceRange?.minVariantPrice?.currencyCode || 'USD'
          }}
        />
      )}

      <SplashScreen title={sanityProductData.store.title} />

      <Details
        sanityProductData={sanityProductData}
        sanitySizeGuide={sanitySizeGuide}
        shopifyProductData={shopifyProductData}
        // shopifyProductRecommendations={shopifyProductRecommendations} // Pass this
        primaryCollection={primaryCollection}
      />

      <Recommendations recommendations={shopifyProductRecommendations} />

      <Sections sanityProductData={sanityProductData} params={params} searchParams={searchParams} />
    </>
  );
};

export default ProductTemplate;