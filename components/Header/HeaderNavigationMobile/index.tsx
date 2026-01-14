'use client';

import React, { useState, useEffect } from 'react';
import classNames from '@/helpers/classNames';
import Container from '@/components/Container';
import Link from '@/components/Link';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import Image from 'next/image';
import { IHeaderDocument } from '@/tools/sanity/schema/documents/headerDocument';
import styles from './styles.module.scss';
import { groq } from 'next-sanity';
import { client } from '@/tools/sanity/lib/client';
import ContactSidebar from '@/components/ContactSidebar/ContactSidebar';

type HeaderNavigationMobileProps = {
  navItems: IHeaderDocument['header']['navItems'];
  mobileNavOpen: boolean;
  setMobileNavOpen: (mobileNavOpen: boolean) => void;
};

const HeaderNavigationMobile: React.FC<HeaderNavigationMobileProps> = props => {
  const { mobileNavOpen, setMobileNavOpen } = props;
  const [navItems, setNavItems] = useState<any[]>([]);
  const [subMenuStack, setSubMenuStack] = useState<any[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contactSidebarOpen, setContactSidebarOpen] = useState(false);

  // Fetch header nav via GROQ
  useEffect(() => {
    const fetchNav = async () => {
      const query = groq`
        *[_type == "headerDocument"][0]{
          header{
            navItems[]{
              title,
              side,
              dropdown,
              link{
                ...,
                internalLink->{
                  _type,
                  title,
                  pathname,
                  "slug": slug.current
                }
              },
              navSublinks[]{
                title,
                link{
                  ...,
                  internalLink->{
                    _type,
                    title,
                    pathname,
                    "slug": slug.current
                  }
                },
                image{ 
                  asset->{
                    _id,
                    url
                  },
                  alt
                },
                navSublinks[]{
                  title,
                  link{
                    ...,
                    internalLink->{
                      _type,
                      title,
                      pathname,
                      "slug": slug.current
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const data = await client.fetch(query);
      setNavItems(data?.header?.navItems || []);
    };
    fetchNav();
  }, []);

  // Show all nav items for mobile, not just left side
  const mobileNavItems = navItems; // Changed: removed the filter
  const topLevelItems = mobileNavItems.filter(item => !item.isSubLink);

  // Open first-level submenu
  const openMenu = (navItem: any) => {
    if (isAnimating || !navItem.navSublinks?.length) return;

    setIsAnimating(true);
    setSubMenuStack([
      {
        level: 0,
        parentTitle: navItem.title,
        items: navItem.navSublinks || [],
        image: navItem.image
      }
    ]);

    setTimeout(() => setIsAnimating(false), 300);
  };

  // Open nested submenu
  const openSubMenu = (sublink: any, parentLevel: number) => {
    if (isAnimating || !sublink.navSublinks?.length) return;

    setIsAnimating(true);
    setSubMenuStack(prev => {
      const updated = prev
        .slice(0, parentLevel + 1)
        .map((lvl, i) => (i === parentLevel ? { ...lvl, activeItem: sublink } : lvl));
      updated.push({
        level: parentLevel + 1,
        parentTitle: sublink.title,
        items: sublink.navSublinks || [],
        image: sublink.image
      });
      return updated;
    });
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Go back in menu hierarchy
  const goBack = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    if (subMenuStack.length > 0) {
      setSubMenuStack(prev => prev.slice(0, -1));
    }
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Close all menus
  const closeAllMenus = () => {
    setIsAnimating(true);
    setMobileNavOpen(false);
    setContactSidebarOpen(false);
    setTimeout(() => {
      setSubMenuStack([]);
      setIsAnimating(false);
    }, 300);
  };

  // Handle hamburger button click
  const handleHamburgerClick = () => {
    if (contactSidebarOpen) {
      // When contact sidebar is open, close it and go back to main menu
      setContactSidebarOpen(false);
      setSubMenuStack([]);
    } else {
      // Toggle main mobile navigation
      if (mobileNavOpen) {
        closeAllMenus();
      } else {
        setSubMenuStack([]);
        setMobileNavOpen(true);
      }
    }
  };

  // Handle Concierge button click
  const handleConciergeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Close any open submenus
    setSubMenuStack([]);
    // Open contact sidebar
    setContactSidebarOpen(true);
    // Also close the mobile menu overlay
    setMobileNavOpen(false);
  };

  // Helper function to convert text to URL-friendly slug
  const generateSlug = (text: string) => {
    if (!text) return '#';

    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const resolveLink = (link: any, itemTitle?: string) => {
    if (!link) return '#';

    // Handle external links
    if (link.linkType === 'external') {
      return link.href || '#';
    }

    // Handle internal links
    if (link.linkType === 'internal') {
      const internalLink = link.internalLink;

      if (!internalLink) return '#';

      // Handle Collection documents
      if (internalLink._type === 'collection') {
        if (internalLink.handle) return `/${internalLink.handle}`;
        if (internalLink.slug) return `/${internalLink.slug}`;
        if (itemTitle) return `/${generateSlug(itemTitle)}`;
        if (internalLink.title) return `/${generateSlug(internalLink.title)}`;
        return '#';
      }

      // Handle other document types
      if (internalLink.pathname) return internalLink.pathname;
      if (internalLink.slug) return internalLink.slug === '' ? '/' : `/${internalLink.slug}`;

      // Fallback to title
      if (itemTitle) return `/${generateSlug(itemTitle)}`;
      if (internalLink.title) return `/${generateSlug(internalLink.title)}`;

      return '#';
    }

    return '#';
  };

  // Get current menu level
  const currentLevel = subMenuStack.length > 0 ? subMenuStack[subMenuStack.length - 1] : null;

  return (
    <>
      {/* Mobile Header Container */}
      <div
        className={classNames(styles.container, {
          [styles.show]: mobileNavOpen
        })}
      >
        {/* Hamburger Button */}
        <div className={styles.buttonContainer}>
          <div
            className={classNames(styles.button, {
              [styles.buttonOpen]: mobileNavOpen
            })}
            role="button"
            onClick={handleHamburgerClick}
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
          />
        </div>

        {/* Navigation Panel */}
        <div
          className={classNames(styles.navigation, {
            [styles.navigationOpen]: mobileNavOpen
          })}
        >
          <Container className={styles.navigationContainer}>
            <div className={styles.contentWrapper}>
              {/* Main Menu Level - Show only top-level items */}
              {!currentLevel && (
                <div className={styles.menuLevel}>
                  <ul className={styles.links}>
                    {topLevelItems.map(navItem => {
                      const navTitle = navItem.title?.toLowerCase() || '';
                      return (
                        <li key={navItem.title} className={styles.linkItem}>
                          {navTitle === 'concierge' ? (
                            <button className={styles.navButton} onClick={handleConciergeClick}>
                              <Text text={navItem.title} size="lg" />
                              <Icon title="chevronRight" className={styles.navIcon} />
                            </button>
                          ) : navItem.navSublinks?.length ? (
                            <button
                              className={styles.navButton}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                openMenu(navItem);
                              }}
                            >
                              <Text text={navItem.title} size="lg" />
                              <Icon title="chevronRight" className={styles.navIcon} />
                            </button>
                          ) : (
                            <Link
                              variant="normal-sm"
                              href={resolveLink(navItem.link, navItem.title)}
                              onClick={closeAllMenus}
                              className={styles.navLink}
                            >
                              <Text text={navItem.title} size="lg" />
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* Submenu Levels */}
              {currentLevel && (
                <div className={styles.menuLevel}>
                  <div className={styles.submenuHeader}>
                    <button className={styles.backButton} onClick={goBack}>
                      <Icon title="chevronLeft" className={styles.backIcon} />
                      <Text text={subMenuStack.length > 1 ? 'Back' : 'Menu'} size="sm" />
                    </button>
                    <h3 className={styles.submenuTitle}>{currentLevel.parentTitle}</h3>
                  </div>

                  {/* Display image if available */}
                  {currentLevel.image?.asset?.url && (
                    <div className={styles.menuImageContainer}>
                      <Image
                        src={currentLevel.image.asset.url}
                        alt={currentLevel.image.alt || currentLevel.parentTitle || 'Menu image'}
                        width={150}
                        height={100}
                        className={styles.menuImage}
                        priority={false}
                      />
                    </div>
                  )}

                  <ul className={styles.links}>
                    {currentLevel.items.map((item: any) => (
                      <li key={item.title} className={styles.linkItem}>
                        {item.navSublinks?.length ? (
                          <button
                            className={styles.navButton}
                            onClick={e => {
                              e.preventDefault();
                              e.stopPropagation();
                              openSubMenu(item, currentLevel.level);
                            }}
                          >
                            <Text text={item.title} size="md" />
                            <Icon title="chevronRight" className={styles.navIcon} />
                          </button>
                        ) : (
                          <Link
                            variant="normal-sm"
                            href={resolveLink(item.link, item.title)}
                            onClick={closeAllMenus}
                            className={styles.navLink}
                          >
                            <Text text={item.title} size="md" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Container>
        </div>
      </div>

      {/* Contact Sidebar - Using the same component as desktop */}
      <ContactSidebar
        isOpen={contactSidebarOpen}
        onClose={() => {
          setContactSidebarOpen(false);
          setMobileNavOpen(false);
        }}
      />
    </>
  );
};

export default HeaderNavigationMobile;
