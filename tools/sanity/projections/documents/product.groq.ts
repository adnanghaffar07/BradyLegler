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
    hideOnCustomizer,
    _type == 'galleryImage' => ${imageProjection},
    _type == 'galleryVideo' => {
       video${fileProjection}
    },
  },
  // Flattened to a URL rather than reusing imageProjection: the configurator needs a
  // string for an <img src>, not an asset object. src is null when the asset has been
  // deleted in Sanity, and getSideImage skips those rows.
  //
  // The CDN transform is not optional. These images are authored in the Studio now, so
  // the originals are whatever the client uploads - a phone or Lightroom export runs to
  // several MB - and SubwayRingImage preloads the WHOLE set on idle to keep finish
  // changes instant. Without a width cap that is tens of MB of eager transfer to render
  // a 424px square. w=1200 covers that at DPR 2; auto=format gets WebP or AVIF.
  configuratorImages[]{
    metal,
    finish,
    "src": image.asset->url + "?w=1200&q=80&auto=format"
  },
  sections[]${sectionsProjection},
  inquireButtonEnabled,
  inquireButtonLabel,
  inquirePriceText,
  seoData
}`;

export default productProjection;
