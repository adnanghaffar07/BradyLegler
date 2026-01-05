import { groq } from 'next-sanity';
import imageProjection from '@/tools/sanity/projections/common/image.groq';

const homeCollectionsProjection = groq`
  _type == 'homeCollections' => {
    title,
    items[] {
      _key,
      image ${imageProjection},
      collection->{
        store {
          title,
          slug {
            current
          }
        }
      }
    }
  },
`;

export default homeCollectionsProjection;
