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
  openGraphImage?: string;
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
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
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
          description: seoDescription || seoData?.seoDescription || metadata.description!!,
          images: seoData?.openGraphImage ? [{ url: seoData.openGraphImage }] : metadata.openGraph.images
        },
        keywords: seoKeywords || seoData?.seoKeywords || metadata.keywords,
        alternates: {
          canonical: process.env.NEXT_PUBLIC_SITE_URL + (params?.slug ? '/' + params.slug.join('/') : ''),
          ...alternates,
          ...seoData?.alternates
        },
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
