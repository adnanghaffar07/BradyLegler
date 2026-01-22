import { groq } from 'next-sanity';
import linkProjection from '@/tools/sanity/projections/common/link.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';

const listArtworkProjection = groq`
  _type == 'listArtwork' => {
      viewOption,
      spacingBetweenArtworks,
     artworks[]->{
      _id,
      title,
      slug,
      pathname,
      specification,
      featureImage${imageProjection}
     }
  },
`;

export default listArtworkProjection;
