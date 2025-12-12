import { groq } from 'next-sanity';
import sectionsProjection from '../common/sections.groq';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import fileProjection from '@/tools/sanity/projections/common/file.groq';
import blockContentProjection from '@/projections/common/blockContent.groq';

const collectionProjection = groq`{
  store {
    createdAt,
    updatedAt,
    isDeleted,
    title,
    id,
    gid,
    slug,
    descriptionHtml,
    imageUrl,
    rules[]{
      column,
      relation,
      condition
    },
    disjunctive,
    sortOrder
  },
  collectionHeader {
    mediaOne {
      mediaType,
      image${imageProjection},
      video${fileProjection},
    },
    mediaTwo {
      mediaType,
      image${imageProjection},
      video${fileProjection},
    },
    tagline,
    addButton,
    button${buttonProjection},
    layout,
    logoTheme,
    quote
  },
  layout,
  sectionsMiddle[]${sectionsProjection},
  sections[]${sectionsProjection},
  quote,
  quotes[] {
    content${blockContentProjection},
    ...
  },
  seoData,
}`;

export default collectionProjection;
