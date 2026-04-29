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
  openGraphImage?: string | undefined;
};

interface GenerateSanityMetadata extends CustomMetadata {
  query?: (params: any) => Promise<CustomMetadata | any>;
}

const generateSanityMetadata = (params: GenerateSanityMetadata) => {
  const { query, seoTitle, seoDescription, seoKeywords, alternates, robots, other } = params;

  if (!query && (!seoTitle || !seoDescription || !seoKeywords)) {
    throw new Error('Missing required parameters for generateSanityMetadata');
  }

const defaultRobots = {
  index: true,
  follow: true,
  nocache: false,
  googleBot: {
    index: true,
    follow: true,
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
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

      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';
      const canonicalUrl = params?.slug ? `${baseUrl}/${params.slug.join('/')}` : baseUrl;
      const resolvedCanonicalUrl = seoData?.alternates?.canonical || alternates?.canonical || canonicalUrl;

      return {
        ...metadata,
        title: seoTitle || seoData?.seoTitle || metadata.title,
        description: seoDescription || seoData?.seoDescription || metadata.description,
        openGraph: {
          ...metadata.openGraph,
          title: seoTitle || seoData?.seoTitle || metadata.title!!,
          description: seoDescription || seoData?.seoDescription || metadata.description!!,
          url: resolvedCanonicalUrl,
          images: seoData?.openGraphImage ? [{ url: seoData.openGraphImage }] : metadata.openGraph.images
        },
        twitter: {
          ...metadata.twitter,
          title: seoTitle || seoData?.seoTitle || metadata.title,
          description: seoDescription || seoData?.seoDescription || metadata.description,
          images: seoData?.openGraphImage ? [seoData.openGraphImage] : metadata.twitter?.images
        },
        keywords: seoKeywords || seoData?.seoKeywords || metadata.keywords,
        alternates: {
          canonical: resolvedCanonicalUrl,
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
