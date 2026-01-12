// productPreviewProjection.groq
import { groq } from 'next-sanity';

const productPreviewProjection = groq`{
  _id,
  store {
    title,
    slug {
      current
    },
    previewImageUrl,
    priceRange {
      minVariantPrice,
      maxVariantPrice
    }
  },
  // ADD THESE FIELDS for Media Gallery
  gallery {
    media[] {
      _type,
      src,
      altText,
      width,
      height,
      url
    }
  },
  galleryImages[] {
    src,
    altText,
    width,
    height
  },
  collectionMedia {
    enable,
    mediaItems[] {
      mediaType,
      alt,
      image {
        asset->{
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        }
      },
      video {
        asset->{
          url
        }
      }
    },
    mediaType,
    video {
      asset->{
        url
      }
    },
    image {
      asset->{
        url,
        metadata {
          dimensions {
            width,
            height
          }
        }
      }
    }
  }
}`;

export default productPreviewProjection;