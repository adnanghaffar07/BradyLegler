import { SanityDocument } from 'next-sanity';
import { notFound } from 'next/navigation';
import { sanityFetch } from '@/tools/sanity/lib/fetch';
import { DOCUMENT_QUERY } from '@/tools/sanity/lib/queries.groq';
import { generateSanityMetadata } from '@/tools/sanity/helpers';
import { resolveShareImage } from '@/tools/sanity/helpers';
import PageTemplate from '@/templates/PageTemplate';

const Home = async (props: PageProps) => {
  const { params, searchParams } = props;

  const document = await sanityFetch<SanityDocument>({
    query: DOCUMENT_QUERY,
    params: { pathname: '/', shopifySlug: '/', types: ['page'] }
  });

  if (!document) return notFound();

  return <PageTemplate data={document?.page} searchParams={searchParams} params={params} />;
};

export const generateMetadata = generateSanityMetadata({
  query: async () => {
    const document = await sanityFetch<SanityDocument>({
      query: DOCUMENT_QUERY,
      params: { pathname: '/', shopifySlug: '/', types: ['page'] }
    });

    const page = document?.page;

    return {
      seoTitle: page?.seoData?.seoTitle,
      seoDescription: page?.seoData?.seoDescription,
      openGraphImage: resolveShareImage(page?.seoData?.openGraphImage, page?.sections, page)
    };
  }
});

export const dynamic = 'force-static';

export default Home;
