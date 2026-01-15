import { groq } from 'next-sanity';
import pageProjection from '../projections/documents/page.groq';
import artworkProjection from '../projections/documents/artwork.groq';
import linkProjection from '../projections/common/link.groq';
import blockContentProjection from '../projections/common/blockContent.groq';
import buttonProjection from '../projections/common/button.groq';
import productProjection from '../projections/documents/product.groq';
import collectionProjection from '../projections/documents/collection.groq';
import fileProjection from '@/projections/common/file.groq';
import imageProjection from '@/projections/common/image.groq';

export const ARTWORKS_QUERY = groq`*[_type == "artwork" && status == $status]${artworkProjection} | order(publishDate desc, _createdAt desc)`;

export const DOCUMENT_QUERY = groq`
  *[_type in $types && (pathname == $pathname || store.slug.current == $shopifySlug)][0]{
    _type,

    // ------------------
    // Page
    _type == 'page' => {
      "page": ${pageProjection}
    },

    // ------------------
    // Artwork
    _type == 'artwork' => {
      "artwork": ${artworkProjection}
    },

    // ------------------
    // Product
    _type == 'product' => {
      "product": ${productProjection}
    },

    // ------------------
    // Collection
    _type == 'collection' => {
      "collection": ${collectionProjection}
    },
  }
`;

export const HEADER_QUERY = groq`
  *[_type == "headerDocument" && _id == "headerDocument"][0]{
    header {
      navItems[]{
        title,
        link${linkProjection},
        dropdown,
        side,
        navSublinks[]{
          title,
          link${linkProjection}
        }
      }
    }
  }
`;

export const FOOTER_QUERY = groq`
  *[_type == "footerDocument" && _id == "footerDocument"][0]{
    footer {
      linkGroup{
        groupTitle,
        links[]${buttonProjection},
      },
      disclaimer${blockContentProjection}
    }
  }
`;

export const SOCIAL_MEDIA_QUERY = groq`
  *[_type == "socialMediaDocument" && _id == "socialMediaDocument"][0]{
    socials[]{
      _key,
      name,
      link
    }
  }
`;

export const COLLECTION_SLUGS_QUERY = groq`
  *[_type == "collection" && !(_id in path("drafts.**") && pathname != '/')]{
    "slug": '/' + store.slug.current + '/'
  }[].slug
`;

export const PRODUCT_SLUGS_QUERY = groq`
  *[_type == "product" && !(_id in path("drafts.**") && pathname != '/')]{
    "slug": '/' + store.slug.current + '/'
  }[].slug
`;

export const SIZE_GUIDE_QUERY = groq`
  *[_type == "sizeGuideDocument" && _id == "sizeGuide"][0]{
    tables[]{
      title,
      collections[]->{
        store {
          gid
        }
      },
      Table{
        rows[]{
          _key,
          cells
        }
      }
    }
  }
`;

// CORRECTED PRODUCTS_QUERY - Matches your gallery structure
export const PRODUCTS_QUERY = groq`
  *[_type == "product" && store.gid in $productIds] {
    "id": store.gid,
    "title": store.title,
    "handle": store.slug.current,
    "productType": store.productType,
    // Get gallery images - CORRECT STRUCTURE
    "gallery": gallery[] {
      _type,
      _type == 'galleryImage' => {
        "src": asset->url,
        "altText": altText,
        "width": asset->metadata.dimensions.width,
        "height": asset->metadata.dimensions.height
      },
      _type == 'galleryVideo' => {
        "videoUrl": asset->url
      }
    },
    // Keep collectionMedia for backward compatibility
 collectionMedia {
  enable,
  mediaItems[] {
    mediaType,
    alt,
    video${fileProjection},
    image${imageProjection}
  }
},
    "priceRange": store.priceRange
  }
`;

// Add this to your queries.groq file
export const PRODUCT_COLLECTIONS_QUERY = groq`
  *[_type == "collection" && defined(store.id) && store.id in $shopifyCollectionIds]{
    store {
      title,
      collectionStory,
      slug {
        current
      },
      imageUrl,
      id
    }
  } | order(_updatedAt desc)
`;