import { groq } from 'next-sanity';
import blockContentProjection from '@/tools/sanity/projections/common/blockContent.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';

const twoColMediaSectionProjection = groq`
  _type == 'twoColMediaSection' => {
      
    imageSideA${imageProjection},
    addButtonSideA,
    taglineSideA,
    buttonSideA${buttonProjection},
    
    imageSideB${imageProjection},
    addButtonSideB,
    taglineSideB,
    buttonSideB${buttonProjection},
    
    invertLayout,
  },
`;

export default twoColMediaSectionProjection;
