import { groq } from 'next-sanity';
import productPreviewProjection from '@/tools/sanity/projections/documents/productPreview.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';

const homeCollectionsProjection = groq`
  _type == 'homeCollections' => {
    title,
    products[]->${productPreviewProjection},
          images[]${imageProjection}

  },
`;

export default homeCollectionsProjection;