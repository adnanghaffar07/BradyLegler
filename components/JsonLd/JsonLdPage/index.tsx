import listItem from '../schemas/listItem';
import organization from '../schemas/organization';
import webPage from '../schemas/webPage';
import breadcrumbList from '../schemas/breadcrumbList';
import metadata from '@/config/metadata';
import { getPageSeoDescriptionFallback } from '@/tools/sanity/helpers';
import website from '@/config/website';
import { IPageDocument } from '@/tools/sanity/schema/documents/page';

type JsonLdPageProps = {
  document: IPageDocument;
};

const JsonLdPage = (props: JsonLdPageProps) => {
  const { document } = props;

  const { _createdAt, _updatedAt, title, seoData } = document || {};

  // Site Data
  const siteName = website?.siteName;
  const siteLanguage = website?.siteLanguage;
  const siteUrl = website?.siteUrl;
  const siteAuthor = website?.author;
  const siteSocials = website?.socialLinks;

  // Document data
  const documentTitle = document?.seoData?.seoTitle || document?.title || metadata?.title;
  const documentDescription =
    document?.seoData?.seoDescription?.trim() ||
    getPageSeoDescriptionFallback(document?.title) ||
    metadata?.description;
  const fallbackDate = new Date(process.env.NEXT_PUBLIC_LAST_UPDATED_AT || new Date()).toISOString();
  const documentCreatedAt = new Date(document?._createdAt);
  const documentUpdatedAt = new Date(document?._updatedAt);
  const documentDatePublished = !isNaN(documentCreatedAt.getTime()) ? documentCreatedAt?.toISOString() : fallbackDate;
  const documentDateModified = !isNaN(documentUpdatedAt.getTime()) ? documentUpdatedAt?.toISOString() : fallbackDate;
  const documentImage = metadata?.openGraph?.images?.[0]?.url;

  // General Data
  const date = new Date();
  const year = date.getFullYear();

  const isValid = [
    document?.seoData?.seoTitle,
    document?.title,
    metadata?.title,
    siteName,
    siteLanguage,
    siteUrl,
    siteAuthor,
    documentTitle,
    documentDescription,
    documentDatePublished,
    documentDateModified,
    documentImage,
    year
  ].every(item => item !== undefined);

  if (process.env.DEBUG_SEO_DATA === 'true') {
    console.log('__DEBUG_SEO_JSONLD', {
      title,
      seoData,
      _createdAt,
      _updatedAt
    });
  }

  const jsonLdSchema = webPage({
    siteName,
    siteLanguage,
    siteUrl,
    siteAuthor,
    documentTitle,
    documentDescription,
    documentDatePublished,
    documentDateModified,
    documentImage,
    year
  });

  const jsonLdOrganization = organization({
    siteName,
    siteUrl,
    siteSocials
  });

  const jsonLdBreadcrumbList = breadcrumbList({
    itemListElement: [
      listItem({
        position: 1,
        name: 'Home',
        item: `${siteUrl}/`
      })
    ]
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbList) }} />
    </>
  );
};

export default JsonLdPage;
