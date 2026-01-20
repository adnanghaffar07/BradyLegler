import { groq } from 'next-sanity';

const imageProjection = groq`{
  asset->{
    ...,
    metadata
  },
  crop,
  hotspot,
  altText,
  aspectRatio,
}`;

export default imageProjection;
