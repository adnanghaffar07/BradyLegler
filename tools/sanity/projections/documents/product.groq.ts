import { groq } from 'next-sanity';
import productVariantProjection from './productVariant.groq';
import sectionsProjection from '../common/sections.groq';
import imageProjection from '../common/image.groq';
import fileProjection from '../common/file.groq';

const productProjection = groq`{
   _id,
  store {
    createdAt,
    updatedAt,
    status,
    isDeleted,
    title,
    id,
    gid,
    slug,
    descriptionHtml,
    productType,
    vendor,
    tags,
    priceRange {
      minVariantPrice,
      maxVariantPrice
    },
    previewImageUrl,
    options,
    variants[]->${productVariantProjection},
  },
     // ADD THIS: Shopify collections data
    collections[] {
      id,
      title,
      handle,
      description
  },
  featureMedia {
    enable,
    mediaItems[] {
      mediaType,
      alt,
      image${imageProjection},
      video${fileProjection},
    },
  },

  gallery[]{
    "type": _type,
    size,
    _type == 'galleryImage' => ${imageProjection},
    _type == 'galleryVideo' => {
       video${fileProjection}
    },
  },
  sections[]${sectionsProjection},
  seoData
}`;

export default productProjection;
