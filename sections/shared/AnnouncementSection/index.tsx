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

  const contentSection = (
    <div className={classNames(styles.container, { [styles.centered]: align === 'center' })}>
      <Text text={title} size="h2" />

      <TextBlock blocks={content} className={styles.content} />

      {(addButton || (addDownloadButton && downloadFile)) && (
        <div className={styles.actions}>
          {addButton && button?.link && button?.label && (
            <Link {...button?.link} className={styles.button} variant={'square'} text={button?.label} />
          )}
          {addDownloadButton && downloadFile?.asset?.url && downloadFile?.downloadButtonText && (
            <Link
              href={downloadFile.asset.url}
              className={classNames(styles.button, styles.download)}
              variant={'square'}
              text={downloadFile.downloadButtonText}
              target="_blank"
              rel="noopener noreferrer"
            />
          )}
        </div>
      )}
    </div>
  );

  return (
    <Section name="AnnouncementSection" theme="dark" {...getSectionSpacingProps(props)}>
      {align === 'center' ? (
        contentSection
      ) : (
        <Layout variant={layoutVariant} className={styles.layout}>
          {layoutVariant === 'leftLarge' ? <div className={styles.placeholder} /> : null}
          {contentSection}
          {layoutVariant === 'rightLarge' ? <div className={styles.placeholder} /> : null}
        </Layout>
      )}
    </Section>
  );
};

export default AnnouncementSection;
