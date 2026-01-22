import { groq } from 'next-sanity';

// Section Projections
import headerHeroSectionProjection from '@/sections/shared/HeaderHeroSection/queries.groq';
import mediaSectionProjection from '@/sections/shared/MediaSection/queries.groq';
import quoteSectionProjection from '@/sections/shared/QuoteSection/queries.groq';
import twoColMediaSectionProjection from '@/sections/shared/TwoColumnMediaSection/queries.groq';
import videoSectionProjection from '@/sections/shared/VideoSection/queries.groq';
import imageCenteredSectionProjection from '@/sections/shared/ImageCenteredSection/queries.groq';
import listArtworkSectionProjection from '@/sections/shared/ListArtworkSection/queries.groq';
import discoverMoreSectionProjection from '@/sections/shared/DiscoverMoreSection/queries.groq';
import announcementSectionProjection from '@/sections/shared/AnnouncementSection/queries.groq';
import fullscreenImageSectionProjection from '@/sections/shared/FullscreenImageSection/queries.groq';
import spacerSectionProjection from '@/sections/shared/SpacerSection/queries.groq';

// New Section Projections
import productsSectionProjection from '@/sections/shared/ProductsSection/queries.groq';
import viewedProductsSectionProjection from '@/sections/product/ViewedProductsSection/queries.groq';
import twoColTextSectionProjection from '@/sections/shared/TwoColumnTextSection/queries.groq';
import linksSectionProjection from '@/sections/shared/LinksSection/queries.groq';
import homeCollectionsProjection from '@/sections/shared/CollectionRow/queries.groq';

const sectionsProjection = groq`{
  _type,
  ${headerHeroSectionProjection}
  ${mediaSectionProjection}
  ${twoColMediaSectionProjection}
  ${quoteSectionProjection}
  ${videoSectionProjection}
  ${imageCenteredSectionProjection}
  ${twoColTextSectionProjection}
  ${listArtworkSectionProjection}
  ${productsSectionProjection}
  ${viewedProductsSectionProjection}
  ${linksSectionProjection}
  ${discoverMoreSectionProjection}
  ${announcementSectionProjection}
  ${fullscreenImageSectionProjection}
  ${spacerSectionProjection}
${homeCollectionsProjection}
  sectionFields {
    spacingOptions {
      removeTopSpacing,
      removeBottomSpacing
    }
  }
}`;

export default sectionsProjection;
