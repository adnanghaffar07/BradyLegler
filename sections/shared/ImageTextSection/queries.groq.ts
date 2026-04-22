import { groq } from 'next-sanity';
import blockContentProjection from '@/tools/sanity/projections/common/blockContent.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';

const imageTextSectionProjection = groq`
  _type == 'imageTextSection' => {
    image${imageProjection},
    textBlock[]${blockContentProjection},
    addButton,
    button${buttonProjection},
    invertLayout,
  },
`;

export default imageTextSectionProjection;
