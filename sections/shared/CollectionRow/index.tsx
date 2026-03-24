import CollectionRowClient from './CollectionRowClient';
import {
  getCollectionByHandle,
  getCollectionProductCountByHandle
} from '@/tools/apis/shopify';
import { sanityFetch } from '@/tools/sanity/lib/fetchFromSection';
import { PRODUCTS_QUERY } from '@/tools/sanity/lib/queries.groq';

interface IGalleryMedia {
  _type: 'image' | 'video';
  src?: string;
  altText?: string;
  width?: number;
  height?: number;
  url?: string;
}

interface IGalleryImage {
  src: string;
  altText?: string;
  width?: number;
  height?: number;
}

interface ICollectionMediaItem {
  mediaType?: 'video' | 'image';
  alt?: string;
  image?: {
    asset?: {
      url: string;
      metadata?: {
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
  };
  video?: {
    asset?: {
      url: string;
    };
  };
}

interface IProduct {
  _id: string;
  store: {
    title: string;
    slug: {
      current: string;
    };
    previewImageUrl?: string;
    priceRange?: {
      minVariantPrice: number;
      maxVariantPrice: number;
    };
    gid?: string;
  };
  gallery?: {
    media?: IGalleryMedia[];
  };
  galleryImages?: IGalleryImage[];
  collectionMedia?: {
    enable?: boolean;
    mediaItems?: ICollectionMediaItem[];
    mediaType?: 'image' | 'video';
    video?: {
      asset?: {
        url: string;
      };
    };
    image?: {
      asset?: {
        url: string;
        metadata: {
          dimensions: {
            height: number;
            width: number;
          };
        };
      };
    };
  };
}

interface ICollection {
  store?: {
    title: string;
    slug: {
      current: string;
    };
    id: string;
  };
}

interface IHomeCollectionsSection {
  title?: string;
  collection?: ICollection;
  products?: IProduct[];
}

const HomeCollectionsSection = async ({ title, collection, products = [] }: IHomeCollectionsSection) => {
  let finalProducts = products;

  // If collection is provided, fetch products from Shopify
  if (collection?.store?.slug?.current) {
    const collectionSlug = collection.store.slug.current;
    
    try {
      // Fetch product count and get all products
      const productCount = await getCollectionProductCountByHandle(collectionSlug);
      const pageNeededForAll = Math.ceil(productCount / 8);
      const collectionData = await getCollectionByHandle(collectionSlug, pageNeededForAll);

      // Extract product IDs
      const productIds = collectionData?.products?.edges?.map(edge => edge?.node?.id)?.filter(Boolean);

      // Fetch Sanity data for products
      let sanityProductData: any[] = [];
      if (Array.isArray(productIds) && productIds.length > 0) {
        sanityProductData = await sanityFetch({
          query: PRODUCTS_QUERY,
          params: { productIds }
        });
      }

      // Merge Shopify and Sanity data
      finalProducts = collectionData?.products?.edges?.map(edge => {
        const sanityProduct = sanityProductData.find(p => p.id === edge?.node?.id);
        const shopifyNode = edge?.node || {};

        // Convert Shopify images to gallery format if available
        const shopifyImages = shopifyNode.images?.edges?.map((img: any) => ({
          _type: 'image' as const,
          src: img?.node?.url || img?.node?.src,
          altText: img?.node?.altText || shopifyNode.title,
          url: img?.node?.url || img?.node?.src
        })) || [];

        return {
          _id: shopifyNode.id,
          store: {
            title: shopifyNode.title,
            slug: {
              current: shopifyNode.handle
            },
            previewImageUrl: shopifyNode.featuredImage?.url,
            priceRange: shopifyNode.priceRange,
            gid: shopifyNode.id
          },
          // Priority: Sanity gallery > Shopify images > previewImageUrl
          ...(sanityProduct?.gallery 
            ? { gallery: sanityProduct.gallery }
            : shopifyImages.length > 0 
              ? { gallery: { media: shopifyImages } }
              : {}
          ),
          ...(sanityProduct?.collectionMedia ? { collectionMedia: sanityProduct.collectionMedia } : {})
        };
      }) || [];
    } catch (error) {
      console.error('Failed to fetch collection products:', error);
      finalProducts = [];
    }
  }

  return (
    <CollectionRowClient
      title={title}
      products={finalProducts}
    />
  );
};

export default HomeCollectionsSection;
