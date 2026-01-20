'use client';

import { usePathname } from 'next/navigation';
import Container from '@/components/Container';
import useHeaderState from './hooks/useHeaderState';
import classNames from '@/helpers/classNames';
import { IHeaderDocument } from '@/tools/sanity/schema/documents/headerDocument';
import LogoText from '@/assets/logo/logo-text.svg';
import LogoMonogram from '@/assets/logo/logo-monogram.svg';
import Link from '@/components/Link';
import HeaderNavigation from '@/components/Header/HeaderNavigation';
import HeaderNavigationMobile from '@/components/Header/HeaderNavigationMobile';
import styles from './styles.module.scss';

interface HeaderProps extends IHeaderDocument {
  className?: string;
  isPageNotFound?: boolean;
  collectionSlugs?: string[];
  productSlugs?: string[];
}

const Header = (props: HeaderProps) => {
  const { header, collectionSlugs, productSlugs } = props;
  const pathname = usePathname();

  let behaviour = 'overlay';
  let appearance = 'light';

  const isHome = pathname === '/';
  const isCollection = collectionSlugs?.includes(pathname);
  const isProduct = productSlugs?.includes(pathname);
  const isStory = pathname?.startsWith('/story');
  const alwaysHidden = isCollection || isProduct || isStory;

  const { mobileNavOpen, setMobileNavOpen, isScrollingDown, isScrollingUp } = useHeaderState({
    alwaysHidden
  });

  if ((isHome || pathname?.startsWith('/gallery')) && pathname !== '/gallery/archive/') {
    behaviour = 'sticky';
    appearance = 'light';
  }

  if (isCollection || isStory || isProduct) {
    behaviour = 'overlay';
    appearance = 'dark';
  }

  return (
    <header
      className={classNames(
        styles.headerContainer,
        styles[`behaviour-${behaviour}`],
        styles[`appearance-${appearance}`],
        { [styles.mobileNavOpen]: mobileNavOpen }
      )}
    >
      <div className={styles.header}>
        <Container className={styles.layout}>
          <HeaderNavigationMobile
            navItems={header.navItems}
            mobileNavOpen={mobileNavOpen}
            setMobileNavOpen={setMobileNavOpen}
          />

          <HeaderNavigation display="left" className={styles.navigation} navItems={header.navItems} />

          <Link href="/" className={classNames(styles.logo, { [styles.showMonogram]: isScrollingDown })}>
            <LogoText className={styles.logoText} />
            <LogoMonogram className={styles.logoMonogram} />
          </Link>

          <HeaderNavigation display="right" className={styles.navigation} navItems={header.navItems} />
        </Container>
      </div>
    </header>
  );
};

export default Header;
