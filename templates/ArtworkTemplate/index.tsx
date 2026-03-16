import Sections from '@/components/Sections';
import JsonLd from '@/components/JsonLd';
import HeaderHeroSection from '@/sections/shared/HeaderHeroSection';
import Text from '@/components/Text';
import Section from '@/components/Section';
import TextBlock from '@/components/TextBlock';

import { IArtwork } from '@/tools/sanity/schema/documents/artwork';
import styles from './styles.module.scss';
import ArtworkEnquiryForm from '@/templates/ArtworkTemplate/ArtworkEnquiryForm';

interface WebPageProps extends PageProps {
  data: IArtwork;
}

const ArtworkTemplate = async (props: WebPageProps) => {
  const { data, params, searchParams } = props;
  const { title, status, specification, content, featureImage, inquireButtonLabel } = data || {};
  const image = data?.featureImage;
  const isOnSale = status === 'onSale';

  return (
    <>
      <HeaderHeroSection image={image} />
      <Section containerClassName={styles.container} theme="dark">
        <Text as="h1" text={title} size="h1" />
        <div className={styles.content}>
          {specification && <Text text={specification} size="b1" />}
          {content && <TextBlock blocks={content} config={{ p: { size: 'b1' } }} />}
        </div>
        <ArtworkEnquiryForm isOnSale={isOnSale} inquireButtonLabel={inquireButtonLabel} />
      </Section>
      <Sections sections={data?.sections} searchParams={searchParams} params={params} />
      <JsonLd.Article document={data} />
    </>
  );
};

export default ArtworkTemplate;
