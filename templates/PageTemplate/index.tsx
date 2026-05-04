import Sections from '@/components/Sections';
import JsonLd from '@/components/JsonLd';
import { IPageDocument } from '@/tools/sanity/schema/documents/page';
import styles from './styles.module.scss';

interface WebPageProps extends PageProps {
  data: IPageDocument;
}

const PageTemplate = async (props: WebPageProps) => {
  const { data, params, searchParams } = props;
  const withScrollSnap = params?.slug?.[0] === 'story';
  const withFullscreenSection = ['fullscreenImageSection', 'headerHeroSection'].includes(data?.sections?.[0]?._type);
  const withTopSpacing = !withScrollSnap && !withFullscreenSection;

  const sections = (
    <Sections sections={data?.sections} searchParams={searchParams} params={params} withScrollSnap={withScrollSnap} />
  );

  return (
    <>
      {withTopSpacing ? <div className={styles.container}>{sections}</div> : sections}
      <JsonLd.Page document={data} />
      <JsonLd.Custom jsonLd={data?.seoData?.jsonLd} />
    </>
  );
};

export default PageTemplate;
