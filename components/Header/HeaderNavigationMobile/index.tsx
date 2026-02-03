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
import PasscodeModal from '@/components/PasscodeModal';
import HeaderNavigationCart from '../HeaderNavigation/HeaderNavigationCart';

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
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [currentPasscodeItem, setCurrentPasscodeItem] = useState<any | null>(null);
  const [onPasscodeSuccess, setOnPasscodeSuccess] = useState<(() => void) | null>(null);

  // Fetch header nav via GROQ
  useEffect(() => {
    const fetchNav = async () => {
      const query = groq`
        *[_type == "headerDocument"][0]{
          header{
            navItems[]{
              _key,
              title,
              side,
              dropdown,
              link{
                ...,
                internalLink->{
                  _type,
                  title,
                  "slug": coalesce(store.slug.current, slug.current, pathname),
                  pathname
                }
              },
              navSublinks[]{
                _key,
                title,
                requiresPasscode,
                passcode,
                image{
                  asset->{
                    _id,
                    url
                  },
                  alt
                },
                link{
                  ...,
                  internalLink->{
                    _type,
                    title,
                    "slug": coalesce(store.slug.current, slug.current, pathname),
                    pathname
                  }
                },
                // Level 2 - Collections
                navSublinks[]{
                  _key,
                  title,
                  requiresPasscode,
                  passcode,
                  image{
                    asset->{
                      _id,
                      url
                    },
                    alt
                  },
                  link{
                    ...,
                    internalLink->{
                      _type,
                      title,
                      "slug": coalesce(store.slug.current, slug.current, pathname),
                      pathname
                    }
                  },
                  // Level 3 - VIP (nested items)
                  navSublinks[]{
                    _key,
                    title,
                    requiresPasscode,
                    passcode,
                    image{
                      asset->{
                        _id,
                        url
                      },
                      alt
                    },
                    link{
                      ...,
                      internalLink->{
                        _type,
                        title,
                        "slug": coalesce(store.slug.current, slug.current, pathname),
                        pathname
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `;

      try {
        const data = await client.fetch(query);
        setNavItems(data?.header?.navItems || []);
      } catch (error) {
        setNavItems([]);
      }
    };
    fetchNav();
  }, []);

  // Show all nav items for mobile (both left and right)
  const mobileNavItems = navItems;
  const topLevelItems = mobileNavItems.filter(item => !item.isSubLink);

  // Deduplicate items by title (what user sees)
  const deduplicateItems = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    
    const seen = new Map();
    return items.filter((item) => {
      // Use title as the primary key for deduplication since that's what's visible
      const key = item.title?.toLowerCase().trim();
      if (!key || seen.has(key)) {
        return false;
      }
      seen.set(key, true);
      return true;
    });
  };

  // Open first-level submenu
  const openMenu = (navItem: any) => {
    if (isAnimating || !navItem.navSublinks?.length) return;

    setIsAnimating(true);

    setSubMenuStack([
      {
        parentTitle: navItem.title,
        items: deduplicateItems(navItem.navSublinks),
        image: navItem.image
      }
    ]);

    setTimeout(() => setIsAnimating(false), 300);
  };


  const openSubMenu = (sublink: any) => {
    if (isAnimating || !sublink.navSublinks?.length) return;

    setIsAnimating(true);

    setSubMenuStack(prev => {
      // slice to current level only
      const newStack = prev.slice(0);

      newStack.push({
        parentTitle: sublink.title,
        items: deduplicateItems(sublink.navSublinks),
        image: sublink.image ?? prev[prev.length - 1]?.image
      });

      return newStack;
    });

    setTimeout(() => setIsAnimating(false), 300);
  };

  // Go back in menu hierarchy - FIXED VERSION
  const goBack = () => {
    if (isAnimating || subMenuStack.length === 0) return;

    setIsAnimating(true);
    setSubMenuStack(prev => prev.slice(0, -1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Close all menus
  const closeAllMenus = () => {
    if (isAnimating) return;

    setIsAnimating(true);
    setMobileNavOpen(false);
    setContactSidebarOpen(false);

    // Clear the menu stack immediately
    setSubMenuStack([]);

    setTimeout(() => {
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

      // Priority order for determining URL
      if (internalLink.pathname) return internalLink.pathname;
      if (internalLink.slug) return `/${internalLink.slug}`;

      // Fallback to title-based slug generation
      if (itemTitle) return `/${generateSlug(itemTitle)}`;
      if (internalLink.title) return `/${generateSlug(internalLink.title)}`;

      return '#';
    }

    // Handle action links
    if (link.linkType === 'action') {
      return '#';
    }

    return '#';
  };

  // Check if user has passcode access
  const hasPasscodeAccess = (item: any) => {
    if (!item.requiresPasscode) return true;
    if (typeof window === 'undefined') return false;
    const stored = sessionStorage.getItem(`vip_access_${item.title}`);
    return stored === 'true';
  };

  // Handle menu item click with passcode check
  const handleMenuItemClick = (item: any, successCallback: () => void) => {
    if (item.requiresPasscode && !hasPasscodeAccess(item)) {
      setCurrentPasscodeItem(item);
      setShowPasscodeModal(true);
      setOnPasscodeSuccess(() => successCallback);
      return false;
    }
    successCallback();
    return true;
  };

  // Handle passcode verification success
  const handlePasscodeSuccess = () => {
    setShowPasscodeModal(false);
    if (onPasscodeSuccess) {
      onPasscodeSuccess();
      setOnPasscodeSuccess(null);
    }
    setCurrentPasscodeItem(null);
  };

  // Get current menu level
  const currentLevel = subMenuStack.length > 0 ? subMenuStack[subMenuStack.length - 1] : null;
  useEffect(() => {
    if (!mobileNavOpen) {
      // Reset menu state when mobile nav closes
      setTimeout(() => {
        setSubMenuStack([]);
        setIsAnimating(false);
      }, 300);
    }
  }, [mobileNavOpen]);
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
                      const hasAccess = hasPasscodeAccess(navItem);
                      return (
                        <li key={navItem.title} className={styles.linkItem}>
                          {navTitle === 'concierge' ? (
                            <button 
                              type="button"
                              className={styles.navButton} 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleConciergeClick(e);
                              }}
                            >
                              <span>{navItem.title}</span>
                              <Icon title="chevronRight" className={styles.navIcon} />
                            </button>
                          ) : navItem.navSublinks?.length || (navItem.requiresPasscode && !hasAccess) ? (
                            <button
                              type="button"
                              className={styles.navButton}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMenuItemClick(navItem, () => openMenu(navItem));
                              }}
                            >
                              <span>{navItem.title}</span>
                              <div className={styles.iconWrapper}>
                                {navItem.requiresPasscode && !hasAccess && (
                                  <Icon title="lock" className={styles.lockIcon} />
                                )}
                                {navItem.navSublinks?.length && (
                                  <Icon title="chevronRight" className={styles.navIcon} />
                                )}
                              </div>
                            </button>
                          ) : (
                            <Link
                              variant="normal-sm"
                              href={hasAccess ? resolveLink(navItem.link, navItem.title) : '#'}
                              onClick={(e) => {
                                if (navItem.requiresPasscode && !hasAccess) {
                                  e.preventDefault();
                                  handleMenuItemClick(navItem, () => {
                                    window.location.href = resolveLink(navItem.link, navItem.title);
                                    closeAllMenus();
                                  });
                                } else {
                                  closeAllMenus();
                                }
                              }}
                              className={styles.navLink}
                            >
                              <span>{navItem.title}</span>
                              {navItem.requiresPasscode && !hasAccess && (
                                <Icon title="lock" className={styles.lockIcon} />
                              )}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                    
                    {/* Cart/Yours Button */}
                    <li className={styles.linkItem}>
                      <div className={styles.mobileCartWrapper}>
                        <HeaderNavigationCart />
                      </div>
                    </li>
                  </ul>
                </div>
              )}

              {/* Submenu Levels */}
              {currentLevel && (
                <div className={styles.menuLevel}>
                  <div className={styles.submenuHeader}>
                    <button 
                      type="button"
                      className={styles.backButton} 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        goBack();
                      }}
                    >
                      <Icon title="chevronLeft" className={styles.backIcon} />
                      <span className={styles.backText}>
                        {subMenuStack.length > 1 ? 'Back' : 'Menu'}
                      </span>
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
                    {deduplicateItems(currentLevel.items).map((item: any) => {
                      const hasAccess = hasPasscodeAccess(item);
                      return (
                        <li key={`${item._key}-${subMenuStack.length}`} className={styles.linkItem}>
                          {item.navSublinks?.length || (item.requiresPasscode && !hasAccess) ? (
                            <button
                              type="button"
                              className={styles.navButton}
                              onClick={e => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleMenuItemClick(item, () => openSubMenu(item));
                              }}
                            >
                              <span>{item.title}</span>
                              <div className={styles.iconWrapper}>
                                {item.requiresPasscode && !hasAccess && (
                                  <Icon title="lock" className={styles.lockIcon} />
                                )}
                                {item.navSublinks?.length && (
                                  <Icon title="chevronRight" className={styles.navIcon} />
                                )}
                              </div>
                            </button>
                          ) : (
                            <Link
                              variant="normal-sm"
                              href={hasAccess ? resolveLink(item.link, item.title) : '#'}
                              onClick={(e) => {
                                if (item.requiresPasscode && !hasAccess) {
                                  e.preventDefault();
                                  handleMenuItemClick(item, () => {
                                    window.location.href = resolveLink(item.link, item.title);
                                    closeAllMenus();
                                  });
                                } else {
                                  closeAllMenus();
                                }
                              }}
                              className={styles.navLink}
                            >
                              <span>{item.title}</span>
                              {item.requiresPasscode && !hasAccess && (
                                <Icon title="lock" className={styles.lockIcon} />
                              )}
                            </Link>
                          )}
                        </li>
                      );
                    })}
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

      {/* Passcode Modal */}
      {currentPasscodeItem && (
        <PasscodeModal
          isOpen={showPasscodeModal}
          onClose={() => {
            setShowPasscodeModal(false);
            setCurrentPasscodeItem(null);
            setOnPasscodeSuccess(null);
          }}
          onSuccess={handlePasscodeSuccess}
          correctPasscode={currentPasscodeItem.passcode}
          menuTitle={currentPasscodeItem.title}
        />
      )}
    </>
  );
};

export default HeaderNavigationMobile;
