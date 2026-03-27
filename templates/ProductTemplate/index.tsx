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

  const shopifyCollections = shopifyProductData?.collections?.edges?.map(e => ({
    id: e.node.id.replace('gid://shopify/Collection/', ''),
    title: e.node.title,
    handle: e.node.handle
  })) || [];

  // Define priority: Specific collections first
  const SPECIFIC_COLLECTIONS = [
    'subway', 'subway-collection',
    'bobby', 'centric', 'line', 'lucia', 'noir-collection',
    'nova', 'pencil', 'saturn-collection', 'wave', 'revel'
  ];

  // Define generic collections to exclude - add your generic collection handles here
  const EXCLUDED_COLLECTIONS = [
    'ring', 'rings',
    'necklace', 'necklaces',
    'bracelet', 'bracelets',
    'earring', 'earrings',
    'pendant', 'pendants',
    'jewelry'
    // Add more generic collection handles as needed
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
          break;
        }
      } catch (error) {
        // Skip failed collection fetch
      }
    }
  }

  // If no specific collection found, try any collection (excluding generic ones)
  if (!primaryCollection && shopifyCollections.length > 0) {
    for (const shopifyCollection of shopifyCollections) {
      // Skip excluded generic collections
      if (EXCLUDED_COLLECTIONS.includes(shopifyCollection.handle)) {
        continue;
      }

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
          break;
        }
      } catch (error) {
        continue;
      }
    }
  }

  // Fisher-Yates shuffle algorithm
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Get recommendations from the same collection instead
  let shopifyProductRecommendations = [];
  
  if (primaryCollection?.store?.slug?.current) {
    try {
      // Fetch collection products (2 pages = 16 products) for a larger pool to choose from
      const collection = await getCollectionByHandle(primaryCollection.store.slug.current, 2);
      
      if (collection?.products?.edges) {
        // Shuffle all products, filter out current, then take 3
        const allProducts = collection.products.edges.map(({ node }) => node);
        const shuffledProducts = shuffleArray(allProducts);
        shopifyProductRecommendations = shuffledProducts
          .filter(product => product.id !== shopifyProductData?.id) // Exclude current product
          .slice(0, 3);
      }
    } catch (error) {
      // Skip failed recommendations fetch
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
      <Sections sanityProductData={sanityProductData} params={params} searchParams={searchParams} />
            <Recommendations recommendations={shopifyProductRecommendations} />
    </>
  );
};

export default ProductTemplate;