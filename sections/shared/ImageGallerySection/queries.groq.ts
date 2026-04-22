import { groq } from 'next-sanity';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';

const imageGallerySectionProjection = groq`
  _type == 'imageGallerySection' => {
    internalLabel,
    images[] {
      image${imageProjection},
      link${buttonProjection},
      size,
    },
    columns,
    gap,
  },
`;

export default imageGallerySectionProjection;
