'use client';

import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';
import Layout from '../Layout';
import Socials from '../Socials';
import Container from '../Container';
import Text from '../Text';
import Link from '../Link';
import classNames from '@/helpers/classNames';
import FormNewsletter from '@/components/Form/FormNewsletter';
import { IFooterDocument } from '@/tools/sanity/schema/documents/footerDocument';
import useHeaderTheme from '@/hooks/useHeaderTheme';
import styles from './styles.module.scss';

interface FooterProps extends IFooterDocument {
  className?: string;
  socials?: {
    _key: string;
    name: string;
    link: string;
  }[];
}

const Footer = (props: FooterProps) => {
  const { footer, socials, className } = props;
  const classes = classNames(styles.footer, className);
  const pathname = usePathname();
  const year = new Date().getFullYear();

  const [footerRef] = useHeaderTheme({ theme: 'dark' });

  if (pathname?.startsWith('/studio')) return null;
  const links = footer?.linkGroup?.links || [];

  return (
    <footer data-theme="light" className={styles.footer} ref={footerRef}>
      <Layout variant="container" className={styles.container}>
        <div className={styles.footerTop}>
          <div className={styles.contact}>
            <FormNewsletter />
          </div>
          <Socials socials={socials} className={styles.socials} />
          {/*<Logo className={classNames(styles.desktop, styles.logo)} />*/}
        </div>

        <ul className={classNames(styles.mobile, styles.links)}>
          {links.map((linkItem, index) => {
            const { label, link } = linkItem;
            return (
              <li key={index}>
                <Link text={label} {...link} variant="normal-sm" />
              </li>
            );
          })}
        </ul>

        {/*<Logo className={classNames(styles.mobile, styles.logo)} />*/}

        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <Text text={`Brady Legler ©${year}`} size="b2" />
          </div>
          <ul className={classNames(styles.desktop, styles.links)}>
            {links.map((linkItem, index) => {
              const { label, link } = linkItem;
              return (
                <li key={index}>
                  <Link text={label} {...link} variant="normal-sm" />
                </li>
              );
            })}
          </ul>
          <div className={styles.rights}>
            <Text text="All rights reserved" size="b2" />
          </div>
        </div>
      </Layout>
    </footer>
  );
};

export default Footer;
