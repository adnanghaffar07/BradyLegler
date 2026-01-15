// headerHeroSection.groq
import { groq } from 'next-sanity';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import fileProjection from '@/tools/sanity/projections/common/file.groq'; // Add this import
import blockContentProjection from '@/tools/sanity/projections/common/blockContent.groq';

const headerHeroSectionProjection = groq`
  _type == 'headerHeroSection' => {
    tagline,
    title,
    content[]${blockContentProjection},
    addButton,
    button${buttonProjection},
    mediaType,
    image${imageProjection},
    videoType,
    videoFile${fileProjection},
    videoUrl,
    thumbnail {
      asset->{
        ...,
        metadata
      }
    }
  },
`;

export default headerHeroSectionProjection;
