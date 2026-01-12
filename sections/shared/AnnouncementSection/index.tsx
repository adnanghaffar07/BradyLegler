import React from 'react';
import Section from '@/components/Section';
import Text from '@/components/Text';
import Link from '@/components/Link';
import TextBlock from '@/components/TextBlock';
import Layout from '@/components/Layout';
import { getSectionSpacingProps } from '@/tools/helpers/section';
import { IAnnouncementSection } from '@/tools/sanity/schema/sections/shared/announcementSection';
import classNames from '@/helpers/classNames';
import styles from './styles.module.scss';

const AnnouncementSection: React.FC<IAnnouncementSection> = props => {
  const { title, content, align = 'left', addButton = false, button, addDownloadButton = false, downloadFile } = props;
  const layoutVariant = align === 'left' ? 'rightLarge' : 'leftLarge';

  return (
    <Section name="AnnouncementSection" theme="dark" {...getSectionSpacingProps(props)}>
      <Layout variant={layoutVariant} className={styles.layout}>
        {layoutVariant === 'leftLarge' ? <div className={styles.placeholder} /> : null}
        <div className={styles.container}>
          <Text text={title} size="h2" />

          <TextBlock blocks={content} className={styles.content} />

          {(addButton || (addDownloadButton && downloadFile)) && (
            <div className={styles.actions}>
              {addButton && button?.link && (
                <div>
                  <Link {...button?.link} className={styles.button} variant={'square'} text={button?.label} />
                </div>
              )}
              {addDownloadButton && downloadFile && (
                <div>
                  <Link
                    href={downloadFile?.asset?.url}
                    className={classNames(styles.button, styles.download)}
                    variant={'square'}
                    text={downloadFile?.downloadButtonText}
                    target="_blank"
                  />
                </div>
              )}
            </div>
          )}
        </div>
        {layoutVariant === 'rightLarge' ? <div className={styles.placeholder} /> : null}
      </Layout>
    </Section>
  );
};

export default AnnouncementSection;
