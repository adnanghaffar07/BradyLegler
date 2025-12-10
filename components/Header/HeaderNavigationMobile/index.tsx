'use client';

import React, { useState, useEffect, useRef } from 'react';
import classNames from '@/helpers/classNames';
import Container from '@/components/Container';
import Link from '@/components/Link';
import Text from '@/components/Text';
import Icon from '@/components/Icon';
import Image from 'next/image';
// import HeaderNavigationCart from './HeaderNavigationCart';
import { ILinkElement } from '@/tools/sanity/schema/elements/link';
import { IHeaderDocument } from '@/tools/sanity/schema/documents/headerDocument';
import styles from './styles.module.scss';
import { groq } from 'next-sanity';
import { client } from '@/tools/sanity/lib/client';

type HeaderNavigationMobileProps = {
  navItems: IHeaderDocument['header']['navItems'];
  mobileNavOpen: boolean;
  setMobileNavOpen: (mobileNavOpen: boolean) => void;
};

type SubMenuState = {
  level: number;
  parentTitle: string;
  items: any[];
  activeItem?: any;
  image?: any;
};

type ContactLink = {
  label: string;
  link: any;
};

type ContactGroup = {
  groupTitle?: string;
  links?: ContactLink[];
};

type ContactLinksSection = {
  layout?: string;
  links?: ContactGroup[];
  additionalLinks?: ContactGroup;
};

const HeaderNavigationMobile: React.FC<HeaderNavigationMobileProps> = props => {
  const { mobileNavOpen, setMobileNavOpen } = props;
  const [navItems, setNavItems] = useState<any[]>([]);
  const [subMenuStack, setSubMenuStack] = useState<SubMenuState[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contactSidebarOpen, setContactSidebarOpen] = useState(false);
  const [contactSectionData, setContactSectionData] = useState<ContactLinksSection | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
      console.log('Fetched nav items:', data);
      setNavItems(data?.header?.navItems || []);
    };
    fetchNav();
  }, []);

  // Reset menu to start when mobile nav opens
  useEffect(() => {
    if (mobileNavOpen) {
      // Reset to main menu when mobile nav opens
      setSubMenuStack([]);
    }
  }, [mobileNavOpen]);

  // Filter only left-side navigation items for mobile
  const mobileNavItems = navItems;

  // Get only top-level categories (not sublinks)
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

  // Handle contact button click
  const handleContactClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Close any open submenus
    setSubMenuStack([]);
    // Open contact sidebar
    setContactSidebarOpen(true);
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

  // Get contact section data from Sanity
  useEffect(() => {
    if (contactSidebarOpen && !contactSectionData) {
      const fetchContactData = async () => {
        try {
          const contactData = await client.fetch(`
            *[_type == "page" && slug.current == "/contact/"][0]{
              _id,
              title,
              slug,
              sections[]{
                _type,
                _type == "linksSection" => {
                  layout,
                  links[]{
                    groupTitle,
                    links[]{ label, link }
                  },
                  additionalLinks{
                    groupTitle,
                    links[]{ label, link }
                  }
                }
              }
            }
          `);

          const linksSection = contactData?.sections?.find((s: any) => s._type === 'linksSection');
          setContactSectionData(linksSection || null);
        } catch (error) {
          console.error('Error fetching contact data:', error);
        }
      };

      fetchContactData();
    }
  }, [contactSidebarOpen, contactSectionData]);

  // Handle contact link clicks
  const handleContactLinkClick = (link: any, label: string) => {
    if (!link) return;

    // Handle external links
    if (link.linkType === 'external') {
      window.open(link.href, '_blank');
      return;
    }

    // Handle internal links
    if (link.linkType === 'internal' && link.internalLink) {
      const internalLink = link.internalLink;

      if (internalLink.pathname) {
        window.location.href = internalLink.pathname;
      } else if (internalLink.slug) {
        window.location.href = `/${internalLink.slug}`;
      }
      return;
    }

    // Handle phone links
    if (label.match(/phone|call|tel|\d{5,}/i)) {
      const phoneNumber = label.replace(/\D/g, '');
      if (phoneNumber) {
        window.location.href = `tel:${phoneNumber}`;
      }
      return;
    }

    // Handle email links
    if (label.includes('@')) {
      window.location.href = `mailto:${label}`;
      return;
    }
  };

  // Extract contact items from section data
  const contactItems = contactSectionData?.links || [];
  const additionalLinks = contactSectionData?.additionalLinks || {};

  // Get current menu level
  const currentLevel = subMenuStack.length > 0 ? subMenuStack[subMenuStack.length - 1] : null;

  return (
    <>
      {/* Mobile Header Container */}
      <div
        className={classNames(styles.container, {
          [styles.show]: mobileNavOpen || contactSidebarOpen
        })}
      >
        {/* Cart Button - Always visible */}
        {/* <div className={styles.cartContainer}>
          <HeaderNavigationCart />
        </div> */}

        {/* Hamburger Button - This is the universal close button */}
        <div className={styles.buttonContainer}>
          <div
            className={classNames(styles.button, {
              [styles.buttonOpen]: mobileNavOpen || contactSidebarOpen
            })}
            role="button"
            onClick={handleHamburgerClick}
            aria-label={mobileNavOpen || contactSidebarOpen ? 'Close menu' : 'Open menu'}
          />
        </div>

        {/* Navigation Panel */}
        <div
          className={classNames(styles.navigation, {
            [styles.navigationOpen]: mobileNavOpen || contactSidebarOpen
          })}
        >
          <Container className={styles.navigationContainer}>
            <div className={styles.contentWrapper}>
              {/* Main Menu Level - Show only top-level items */}
              {!currentLevel && !contactSidebarOpen && (
                <div className={styles.menuLevel}>
                  <ul className={styles.links}>
                    {topLevelItems.map(navItem => (
                      <li key={navItem.title} className={styles.linkItem}>
                        {navItem.title?.toLowerCase() === 'contact' ? (
                          <button className={styles.navButton} onClick={handleContactClick}>
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
                          >
                            <Text text={navItem.title} size="lg" />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Submenu Levels */}
              {currentLevel && !contactSidebarOpen && (
                <div className={styles.menuLevel}>
                  <div className={styles.submenuHeader}>
                    <button className={styles.backButton} onClick={goBack}>
                      <Icon title="chevronLeft" className={styles.backIcon} />
                      <Text className={styles.text} text={subMenuStack.length > 1 ? 'Back' : 'Menu'} size="sm" />
                    </button>
                    <h3 className={styles.submenuTitle}>{currentLevel.parentTitle}</h3>
                  </div>

                  {/* Display image if available - with proper sizing */}
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
                          <Link variant="normal-sm" href={resolveLink(item.link, item.title)} onClick={closeAllMenus}>
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

      {/* Contact Sidebar - Separate Panel */}
      {contactSidebarOpen && (
        <div className={classNames(styles.container, styles.contactContainer, styles.show)}>
          <div className={classNames(styles.navigation, styles.navigationOpen)}>
            <Container className={styles.navigationContainer}>
              <div className={styles.contactContent}>
                {/* Contact Sidebar Header - Simplified */}
                <div className={styles.contactHeader}>
                  <button className={styles.backButton} onClick={() => setContactSidebarOpen(false)}>
                    <Icon title="chevronLeft" className={styles.backIcon} />
                    <Text text="Back" size="sm" />
                  </button>
                  <h2 className={styles.contactHeading}>Contact Us</h2>
                  {/* REMOVED the extra close button - we use the hamburger/cross button */}
                </div>

                <p className={styles.contactDescription}>
                  Our team of experts is available to answer all your questions from assistance with your orders to
                  style advice and gift ideas.
                </p>

                <div className={styles.linksWrapper}>
                  {contactItems.map((group, i) => (
                    <div key={i} className={styles.contactGroup}>
                      {group.groupTitle && <h4 className={styles.groupTitle}>{group.groupTitle}</h4>}

                      {group.links?.map((item, idx) => (
                        <button
                          key={idx}
                          className={classNames(styles.contactRow, {
                            [styles.phoneLink]: /phone|call|tel|\d{5,}/i.test(item.label),
                            [styles.emailLink]: /@|email|mail/i.test(item.label)
                          })}
                          onClick={() => handleContactLinkClick(item.link, item.label)}
                        >
                          <span>{item.label}</span>
                          <Icon title="chevronRight" className={styles.navIcon} />
                        </button>
                      ))}
                    </div>
                  ))}

                  {(additionalLinks?.links ?? []).length > 0 && (
                    <div className={styles.contactGroup}>
                      {additionalLinks.groupTitle && (
                        <h4 className={styles.groupTitle}>{additionalLinks.groupTitle}</h4>
                      )}

                      {(additionalLinks.links ?? []).map((item, idx) => (
                        <button
                          key={idx}
                          className={classNames(styles.contactRow, {
                            [styles.phoneLink]: /phone|call|tel|\d{5,}/i.test(item.label),
                            [styles.emailLink]: /@|email|mail/i.test(item.label)
                          })}
                          onClick={() => handleContactLinkClick(item.link, item.label)}
                        >
                          <span>{item.label}</span>
                          <Icon title="chevronRight" className={styles.navIcon} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Container>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderNavigationMobile;
