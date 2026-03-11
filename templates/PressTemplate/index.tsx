import Sections from '@/components/Sections';
import JsonLd from '@/components/JsonLd';
import PressHeaderSection from '@/sections/shared/PressHeaderSection';
import Text from '@/components/Text';
import Section from '@/components/Section';
import TextBlock from '@/components/TextBlock';

import { IPress } from '@/tools/sanity/schema/documents/press';
import styles from './styles.module.scss';

interface WebPageProps extends PageProps {
  data: IPress;
}

const PressTemplate = async (props: WebPageProps) => {
  const { data, params, searchParams } = props;
  const { title, subtitle, content, featureImage } = data || {};
  const image = data?.featureImage;

  return (
    <>
      <PressHeaderSection image={image} />
      <Section containerClassName={styles.container} theme="dark">
        <Text as="h1" text={title} size="h1" />
        {subtitle && <Text as="p" text={subtitle} size="b1" />}
        <div className={styles.content}>
          {content && <TextBlock blocks={content} config={{ p: { size: 'b1' } }} />}
        </div>
      </Section>
      <Sections sections={data?.sections} searchParams={searchParams} params={params} />
      <JsonLd.Article document={data} />
    </>
  );
};

export default PressTemplate;
