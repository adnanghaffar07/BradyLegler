import React from 'react';
import { draftMode } from 'next/headers';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ModalPortal from '@/components/Modal/ModalPortal';
import Cart from '@/components/Cart';
import VisualEditing from '@/components/VisualEditing';
import ScrollToTop from '@/components/ScrollToTop';
import { sanityFetch } from '@/tools/sanity/lib/fetch';
import {
  COLLECTION_SLUGS_QUERY, 
  FOOTER_QUERY,
  HEADER_QUERY,
  SOCIAL_MEDIA_QUERY,
  PRODUCT_SLUGS_QUERY
} from '@/tools/sanity/lib/queries.groq';
import { IHeaderDocument } from '@/tools/sanity/schema/documents/headerDocument';
import { IFooterDocument } from '@/tools/sanity/schema/documents/footerDocument';
import '@/sass/global/styles.scss';

type PageLayoutProps = {
  children: React.ReactNode;
};

const PageLayout: React.FC<PageLayoutProps> = async props => {
  const { children } = props;
  const headerDocument = await sanityFetch<IHeaderDocument>({ query: HEADER_QUERY, tags: ['headerDocument'] });
  const footerDocument = await sanityFetch<IFooterDocument>({ query: FOOTER_QUERY, tags: ['footerDocument'] });
  const socialMediaDocument = await sanityFetch<any>({ query: SOCIAL_MEDIA_QUERY, tags: ['socialMediaDocument'] });
  const productSlugs = await sanityFetch<string[]>({ query: PRODUCT_SLUGS_QUERY, tags: ['headerProductSlugs'] });
  const collectionSlugs = await sanityFetch<string[]>({
    query: COLLECTION_SLUGS_QUERY,
    tags: ['headerCollectionSlugs']
  });

  return (
    <>
      <ScrollToTop />
      <Header {...headerDocument} collectionSlugs={collectionSlugs} productSlugs={productSlugs} />
      <main>{children}</main>
      <Cart />
      {draftMode().isEnabled && <VisualEditing />}
      <Footer {...footerDocument} socials={socialMediaDocument?.socials} />
      <ModalPortal />
    </>
  );
};

export default PageLayout;
  