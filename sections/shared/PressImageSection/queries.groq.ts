import { groq } from 'next-sanity';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';

const pressImageSectionProjection = groq`
  _type == 'pressImageSection' => {
    image${imageProjection},
    addButton,
    button${buttonProjection},
    orientation,
    layout
  },
`;

export default pressImageSectionProjection;
