import { createElement } from 'react';
import * as sectionsLibrary from '@/sections';
import * as string from '@/tools/helpers/string';
import ContainerScrollSnap from './ContainerScrollSnap';
import Text from '@/components/Text';
import styles from './styles.module.scss';

interface SectionLibrary {
  [key: string]: React.ComponentType<any>;
}

interface SectionProps {
  sections: {
    _key: string;
    _type: string;
  }[];
  params?: { [key: string]: string } | undefined;
  searchParams?: { [key: string]: string } | undefined;
  extraData?: [{ [key: string]: any }];
  withScrollSnap?: boolean;
}

const IS_DEV = process.env.NODE_ENV === 'development';

const Sections = async (props: SectionProps) => {
  const { sections, searchParams, params, extraData, withScrollSnap = false } = props;
  if (!sections) return null;

  return (
    <ContainerScrollSnap withScrollSnap={withScrollSnap}>
      {sections.map(section => {
        const { _key: key, _type: type, ...sectionProps } = section;
        // Add a mapping for Sanity _type to React components
        const sectionMap: { [key: string]: string } = {
          homeCollections: 'HomeCollectionsSection',
          headerHeroSection: 'HeaderHeroSection',
          fullscreenImageSection: 'FullscreenImageSection',
          spacerSection: 'SpacerSection'
          // add other sections as needed
        };

        const sectionType = sectionMap[type] || string.toCapitalise(type);
        const sectionComponent = (sectionsLibrary as SectionLibrary)[sectionType];

        const sectionExtraData = extraData?.find(data => data?.[sectionType]);

        if (sectionComponent) {
          return createElement(sectionComponent, {
            ...sectionProps,
            extraData: sectionExtraData,
            params,
            searchParams,
            key,
            id: key,
            type: sectionType,
            className: withScrollSnap ? styles.scrollSnap : ''
          });
        } else {
          if (!IS_DEV) return null;
          return (
            <section
              key={key}
              style={{
                border: '1px dashed black',
                padding: '24px',
                margin: '24px',
                textAlign: 'center',
                borderRadius: '8px'
              }}
            >
              <Text as="p" text={`Missing "${sectionType}" section`} />
            </section>
          );
        }
      })}
    </ContainerScrollSnap>
  );
};

export default Sections;
