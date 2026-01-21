import { groq } from 'next-sanity';

const spacerSectionProjection = groq`
  _type == "spacerSection" => {
    height,
    mobileHeight,
    useSeparateMobileSpacing
  },
`;

export default spacerSectionProjection;
