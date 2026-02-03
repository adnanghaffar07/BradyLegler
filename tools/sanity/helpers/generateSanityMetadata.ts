import { ResolvingMetadata, Metadata } from 'next';
import metadata from '@/config/metadata';

type CustomMetadata = {
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  alternates?: {
    canonical?: string;
  };
  robots?: any;
  other?: any;
};

interface GenerateSanityMetadata extends CustomMetadata {
  query?: (params: any) => Promise<CustomMetadata>;
}

const generateSanityMetadata = (params: GenerateSanityMetadata) => {
  const { query, seoTitle, seoDescription, seoKeywords, alternates, robots, other } = params;

  if (!query && (!seoTitle || !seoDescription || !seoKeywords)) {
    throw new Error('Missing required parameters for generateSanityMetadata');
  }

  const defaultRobots = {
    index: process.env.NEXT_PUBLIC_IS_STAGING !== 'true',
    googleBot: {
      index: process.env.NEXT_PUBLIC_IS_STAGING !== 'true'
    }
  };

  let seoData: CustomMetadata = {
    seoTitle,
    seoDescription,
    seoKeywords,
    alternates: alternates || {},
    robots: robots,
    other
  };

  // Generate Metadata for Next.JS
  // https://nextjs.org/docs/app/api-reference/functions/generate-metadata
  // Dynamic metadata depends on dynamic information, such as the current route parameters,
  // external data, or metadata in parent segments,
  // can be set by exporting a generateMetadata function that returns a Metadata object.
  const generateMetadata = async (props: PageProps, parent: ResolvingMetadata): Promise<Metadata> => {
    try {
      const { params } = props;

      // Fetch Sanity document
      if (query) {
        seoData = await query(params);
      }

      return {
        ...metadata,
        title: seoTitle || seoData?.seoTitle || metadata.title,
        description: seoDescription || seoData?.seoDescription || metadata.description,
        openGraph: {
          ...metadata.openGraph,
          title: seoTitle || seoData?.seoTitle || metadata.title!!,
          description: seoDescription || seoData?.seoDescription || metadata.description!!
        },
        keywords: seoKeywords || seoData?.seoKeywords || metadata.keywords,
        alternates: alternates || seoData?.alternates || {},
        robots: robots || seoData?.robots || defaultRobots,
        other: {
          ...metadata.other,
          ...seoData?.other
        }
      };
    } catch (error) {
      return {};
    }
  };

  return generateMetadata;
};

export default generateSanityMetadata;
