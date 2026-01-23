import { notFound } from 'next/navigation';
import { SanityDocument } from 'next-sanity';
import metadata from '@/config/metadata';
import { sanityFetch } from '@/tools/sanity/lib/fetch';
import { DOCUMENT_QUERY } from '@/tools/sanity/lib/queries.groq';
import { generateSanityMetadata } from '@/tools/sanity/helpers';
import { client } from '@/tools/sanity/lib/client';

// Templates
import PageTemplate from '@/templates/PageTemplate';
import ArtworkTemplate from '@/templates/ArtworkTemplate';
import ProductTemplate from '@/templates/ProductTemplate';
import CollectionTemplate from '@/templates/CollectionTemplate';

const Document = async (props: PageProps) => {
  const { params, searchParams } = props;
  const slugArray = params?.slug as string[];

  if (!slugArray || slugArray.length === 0) {
    return notFound();
  }

  const pathname = `/${slugArray.join('/')}/`;
  const shopifySlug = slugArray[slugArray.length - 1];

  console.log('🔍 Fetching document for pathname:', pathname);
  console.log('🔍 Shopify slug:', shopifySlug);

  try {
    const document = await sanityFetch<SanityDocument>({
      query: DOCUMENT_QUERY,
      params: {
        pathname,
        shopifySlug,
        types: ['page', 'artwork', 'product', 'collection']
      }
    });

    console.log('📄 Document fetched:', document);
    console.log('📄 Document type:', document?._type);

    if (!document) {
      console.log('❌ No document found for:', pathname);
      return notFound();
    }

    const documentType = document?._type;

    switch (documentType) {
      case 'page':
        if (document?.page) {
          console.log('📄 Rendering page template');
          return <PageTemplate data={document?.page} searchParams={searchParams} params={params} />;
        }
        break;
      case 'artwork':
        if (document?.artwork) {
          console.log('🎨 Rendering artwork template');
          return <ArtworkTemplate data={document?.artwork} searchParams={searchParams} params={params} />;
        }
        break;
      case 'product':
        if (document?.product) {
          console.log('🛍️ Rendering product template');
          return <ProductTemplate data={document?.product} searchParams={searchParams} params={params} />;
        }
        break;
      case 'collection':
        if (document?.collection) {
          console.log('📦 Rendering collection template');
          return <CollectionTemplate data={document?.collection} searchParams={searchParams} params={params} />;
        }
        break;
      default:
        console.log('❌ Unknown document type:', documentType);
        return notFound();
    }

    // If we get here, it means the document type was found but the specific data wasn't
    console.log('❌ Document type found but data missing for:', documentType);
    return notFound();
  } catch (error) {
    console.error('💥 Error fetching document:', error);
    return notFound();
  }
};

export const generateMetadata = generateSanityMetadata({
  query: async params => {
    const slug = params.slug;
    const slugAsArray = Array.isArray(slug) ? slug : [slug];
    const pathname = `/${slugAsArray.join('/')}/`;
    const shopifySlug = slugAsArray[slugAsArray.length - 1];

    console.log('🔍 Generating metadata for:', pathname);

    try {
      const document = await sanityFetch<SanityDocument>({
        query: DOCUMENT_QUERY,
        params: { pathname, shopifySlug, types: ['page', 'artwork', 'product', 'collection'] }
      });

      if (!document) {
        return {
          seoTitle: `${metadata.title}`,
          seoDescription: ''
        };
      }

      const documentType = document?._type;
      const canonicalPath = params?.slug?.join('/');

      console.log('📄 Metadata document type:', documentType);

      switch (documentType) {
        case 'page':
          return {
            seoTitle: document?.page?.seoData?.seoTitle || `${document?.page?.title} | ${metadata.title}`,
            seoDescription: document?.page?.seoData?.seoDescription,
            alternates: {
              canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${canonicalPath}/`
            },
            robots: document?.page?.seoData?.noIndex ? { index: false, googleBot: { index: false } } : undefined
          };
        case 'artwork':
          return {
            seoTitle: document?.artwork?.seoData?.seoTitle || `${document?.artwork?.title} | ${metadata.title}`,
            seoDescription: document?.artwork?.seoData?.seoDescription,
            alternates: {
              canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${canonicalPath}/`
            },
            robots: document?.artwork?.seoData?.noIndex ? { index: false, googleBot: { index: false } } : undefined
          };
        case 'product':
          return {
            seoTitle: document?.product?.seoData?.seoTitle || `${document?.product?.store?.title} | ${metadata.title}`,
            seoDescription: document?.product?.seoData?.seoDescription,
            alternates: {
              canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${canonicalPath}/`
            },
            robots: document?.product?.seoData?.noIndex ? { index: false, googleBot: { index: false } } : undefined
          };
        case 'collection':
          return {
            seoTitle:
              document?.collection?.seoData?.seoTitle || `${document?.collection?.store?.title} | ${metadata.title}`,
            seoDescription: document?.collection?.seoData?.seoDescription,
            alternates: {
              canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/${canonicalPath}/`
            },
            robots: document?.collection?.seoData?.noIndex ? { index: false, googleBot: { index: false } } : undefined
          };
        default:
          return {
            seoTitle: `${metadata.title}`,
            seoDescription: ''
          };
      }
    } catch (error) {
      console.error('💥 Error generating metadata:', error);
      return {
        seoTitle: `${metadata.title}`,
        seoDescription: ''
      };
    }
  }
});

export const generateStaticParams = async () => {
  const BLACKLISTED_PAGES = [
    'test-equal-ring',
    'accrete-ring',
    'baguette-earrings',
    'baguette-ring',
    'baguette-subway-bracelet-yellow-gold',
    'baguette-subway-ring-yellow-gold',
    'bobby-necklace-yellow-gold',
    'bullseye-ring',
    'double-band',
    'double-band-subway-ring-yellow-gold',
    'double-subway-earrings',
    'double-subway-earrings-yellow-gold',
    'double-subway-ring',
    'double-subway-ring-yellow-gold',
    'inside-out-hoops',
    'line-pendant-necklace',
    'nova-round-diamond-earrings-yellow-gold',
    'pencil-diamond-ring-white-gold',
    'pencil-diamond-ring-yellow-gold',
    'rarities-1',
    'rectangle-diamond-earrings',
    'rectangle-diamond-earrings-yellow-gold',
    'rectangle-earrings',
    'rectangle-subway-diamond-earrings-yellow-gold',
    'single-subway-bracelet',
    'single-subway-bracelet-yellow-gold',
    'subway-single-earrings-white-gold',
    'test-accrete-ring-new-edition',
    'test-alpine',
    'test-baguette-subway-bracelet',
    'test-bullseye-bracelet',
    'test-bullseye-bracelet-1',
    'test-earring',
    'test-free-dive',
    'test-line-hoop-earrings',
    'test-line-pendant',
    'test-paint-brush-pendant',
    'test-pearl-strand-18',
    'test-round-stud-earrings',
    'test-sargasso-sea',
    'test-subway-ms',
    'test-subway-ring',
    'test-unique-accrete-ring-single-edition',
    'tet-baguette-eternity-band',
    // new pages from prerender errors
    'bobby-earrings-white-gold',
    'bobby-earrings-yellow-gold',
    'bobby-necklace-white-gold',
    'centric-black-circle-bracelet-white-gold',
    'centric-black-circle-earrings-white-gold',
    'centric-black-circle-ring-white-gold',
    'centric-stud-earrings-white-gold',
    'centric-stud-earrings-yellow-gold',
    'centric-white-circle-bracelet-white-gold',
    'centric-white-circle-earring-white-gold',
    'centric-white-circle-ring-white-gold',
    'line-diamond-bar-earrings-white-gold',
    'line-diamond-bar-earrings-yellow-gold',
    'line-diamond-bar-necklace-white-gold',
    'line-diamond-bar-necklace-yellow-gold',
    'line-diamond-bar-ring-white-gold',
    'line-diamond-bar-ring-yellow-gold',
    'line-four-band-earrings-white-gold',
    'line-four-band-earrings-yellow-gold',
    'line-four-band-ring-white-gold',
    'line-four-band-ring-yellow-gold',
    'line-large-hoop-earrings-white-gold',
    'line-large-hoop-earrings-with-earwire-white-gold',
    'line-large-hoop-earrings-with-earwire-yellow-gold',
    'line-large-hoop-earrings-yellow-gold',
    'line-oval-earrings-white-gold',
    'line-oval-earrings-yellow-gold',
    'line-pave-earrings-white-gold',
    'line-pave-earrings-yellow-gold',
    'line-pave-pendant-white-gold',
    'line-pave-pendant-yellow-gold',
    'line-pave-ring-white-gold',
    'line-pave-ring-yellow-gold',
    'line-pendant-necklace-white-gold',
    'line-pendant-necklace-yellow-gold',
    'line-small-hoop-earrings-white-gold',
    'line-small-hoop-earrings-yellow-gold',
    'lucia-long-necklace-white-gold',
    'lucia-long-necklace-yellow-gold',
    'lucia-short-necklace-white-gold',
    'lucia-short-necklace-yellow-gold',
    'noir-bracelet',
    'noir-choker',
    'nova-oval-earrings-white-gold',
    'nova-oval-necklace-white-gold',
    'pencil-all-diamond-earrings-white-gold',
    'pencil-all-diamond-earrings-yellow-gold',
    'pencil-diamond-tip-earrings-white-gold',
    'pencil-diamond-tip-earrings-yellow-gold',
    'pencil-ring-white-gold',
    'pencil-ring-yellow-gold',
    'subway-baguette-bracelet-white-gold',
    'subway-baguette-bracelet-yellow-gold',
    'subway-baguette-earrings-white-gold',
    'subway-baguette-earrings-yellow-gold',
    'subway-baguette-ring-white-gold',
    'subway-baguette-ring-yellow-gold',
    'subway-double-band-ring-white-gold',
    'subway-double-band-ring-yellow-gold',
    'subway-double-huggie-earrings-white-gold',
    'subway-double-huggie-earrings-yellow-gold',
    'subway-inside-out-earrings-white-gold',
    'subway-inside-out-earrings-yellow-gold',
    'subway-rectangle-all-diamond-earrings-white-gold',
    'subway-rectangle-all-diamond-earrings-yellow-gold',
    'subway-rectangle-earrings-white-gold',
    'subway-rectangle-earrings-yellow-gold',
    'subway-rectangle-id-bracelet-white-gold',
    'subway-rectangle-id-bracelet-yellow-gold',
    'subway-single-band-ring-white-gold',
    'subway-single-band-ring-yellow-gold',
    'subway-single-bracelet-white-gold',
    'subway-single-bracelet-yellow-gold',
    'subway-single-huggie-earrings-white-gold',
    'subway-single-huggie-earrings-yellow-gold',
    'wave-bracelet-white-gold',
    'wave-bracelet-yellow-gold',
    'wave-earrings-white-gold',
    'wave-earrings-yellow-gold',
    'wave-necklace-white-gold',
    'wave-necklace-yellow-gold',
    'wave-ring-white-gold',
    'wave-ring-yellow-gold'
  ];

  try {
    console.log('🔧 Generating static params...');

    const docSlugs: any[] = await client.fetch(
      `
      *[_type in $types && !(_id in path("drafts.**"))]{
        _type,
        "slug": select(
          _type == "page" => coalesce(pathname, ''),
          _type == "artwork" => coalesce(pathname, ''),
          _type == "product" => '/' + store.slug.current + '/',
          _type == "collection" => '/' + store.slug.current + '/',
          ''
        )
      }
    `,
      {
        types: ['page', 'artwork', 'product', 'collection']
      }
    );

    console.log('📄 Raw documents from Sanity:', docSlugs);

    // Process and filter slugs
    const validSlugs = docSlugs
      .map(doc => {
        if (!doc?.slug || typeof doc.slug !== 'string') return null;
        const slugParts = doc.slug
          .replace(/^\/+|\/+$/g, '')
          .split('/')
          .filter(Boolean);
        if (slugParts.length === 0) return null;

        const lastSegment = slugParts[slugParts.length - 1];
        if (BLACKLISTED_PAGES.includes(lastSegment)) return null;

        return { slug: slugParts };
      })
      .filter(Boolean) as { slug: string[] }[];

    console.log('✅ Final static params:', validSlugs);
    return validSlugs;
  } catch (error) {
    console.error('💥 Error generating static params:', error);
    return [];
  }
};

export const dynamicParams = true;
export const dynamic = 'force-dynamic';

export default Document;
