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
  //
  // The yellow and white gold versions of a ring are the same design (the customizer
  // switches metal itself), so they share one image set: a product with no images of
  // its own borrows them from a sibling with the same title before " - ", e.g.
  // "Subway Double Band Ring - White Gold" uses "Subway Double Band Ring - Yellow Gold".
  "configuratorImages": select(
    count(configuratorImages) > 0 => configuratorImages,
    *[
      _type == "product" &&
      !(_id in path("drafts.**")) &&
      count(configuratorImages) > 0 &&
      string::split(store.title, " - ")[0] == string::split(^.store.title, " - ")[0]
    ][0].configuratorImages
  )[]{
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
