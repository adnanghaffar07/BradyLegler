import { groq } from 'next-sanity';
import buttonProjection from '@/tools/sanity/projections/common/button.groq';
import imageProjection from '@/tools/sanity/projections/common/image.groq';
import fileProjection from '@/projections/common/file.groq';
import blockContentProjection from '@/tools/sanity/projections/common/blockContent.groq';

const discoverMoreSectionProjection = groq`
  _type == 'discoverMoreSection' => {
     title,
     links[]->{
      _type,
      pathname,
      title,
      status,
      featureImage${imageProjection},      
            
      store {
        title,
        status,
        priceRange {
          minVariantPrice {
            amount,
            currencyCode
          },
          maxVariantPrice {
            amount,
            currencyCode
          }
        },
        previewImageUrl,
        slug {
          current
        },
      },
      featureMedia {
        mediaType,
        enable,
        video${fileProjection},
        image${imageProjection}
      }
    },
  },
`;

export default discoverMoreSectionProjection;

