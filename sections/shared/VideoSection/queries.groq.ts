import { groq } from 'next-sanity';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';
import fileProjection from '@/tools/sanity/projections/common/file.groq';

const videoSectionProjection = groq`
  _type == 'videoSection' => {
    tagline,
    videoType,
    videoFile${fileProjection},
    videoUrl,
    addButton,
    button${buttonProjection},
    thumbnail {
      asset->{
        ...,
        metadata
      }
    }
  },
`;

export default videoSectionProjection;
