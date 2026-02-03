'use client';

import React, { useState, useRef, useEffect } from 'react';
import classNames from '@/helpers/classNames';
import HeaderNavigationCart from './HeaderNavigationCart';
import Link from '@/components/Link';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Image from 'next/image';
import styles from './styles.module.scss';
import { groq } from 'next-sanity';
import { client } from '@/tools/sanity/lib/client';
import ContactSidebar from '@/components/ContactSidebar/ContactSidebar';
import PasscodeModal from '@/components/PasscodeModal';

type SubMenuState = {
  level: number;
  parentTitle: string;
  items: any[];
  activeItem?: any;
  image?: any;
  inheritedImage?: any; // Track inherited image from parent
};

const HeaderNavigation = ({ className, display }: { className?: string; display: 'left' | 'right' | 'all' }) => {
  const classes = classNames(styles.container, className);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subMenuStack, setSubMenuStack] = useState<SubMenuState[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contactSidebarOpen, setContactSidebarOpen] = useState(false);
  // In your component
  const [menuOffsets, setMenuOffsets] = useState([0, 70, 140, 210]);
  const [passcodeModal, setPasscodeModal] = useState<{
    isOpen: boolean;
    item: any;
    correctPasscode: string;
    onVerified: () => void;
  } | null>(null);

  useEffect(() => {
    const updateOffsets = () => {
      const width = window.innerWidth;
      if (width >= 1536) {
        setMenuOffsets([0, 130, 250, 370]);
      } else if (width >= 1280) {
        setMenuOffsets([0, 120, 230, 340]);
      } else if (width >= 1024) {
        setMenuOffsets([0, 110, 210, 310]);
      } else if (width >= 768) {
        setMenuOffsets([0, 100, 190, 280]);
      } else {
        setMenuOffsets([0, 70, 140, 210]);
      }
    };

    updateOffsets();
    window.addEventListener('resize', updateOffsets);
    return () => window.removeEventListener('resize', updateOffsets);
  }, []);

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
                  "slug": coalesce(store.slug.current, slug.current, pathname),
                  pathname
                }
              },
              navSublinks[]{
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

  const filteredLinks = navItems.filter(navItem => navItem.side === display || display === 'all');

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

  // Open menu at any level
  const openMenu = (items: any[], title: string, image?: any, level?: number, parentImage?: any) => {
    if (isAnimating || !items?.length) return;

    setIsAnimating(true);

    // Deduplicate items
    const uniqueItems = deduplicateItems(items);

    // Determine which image to use: current item's image or inherited from parent
    const imageToUse = image || parentImage;

    if (level !== undefined) {
      // Opening nested menu - keep previous levels
      const currentLevelImage = subMenuStack[level]?.image;

      setSubMenuStack(prev => {
        const updated = prev.slice(0, level + 1);
        updated[level] = {
          ...updated[level],
          activeItem: { title, image: imageToUse }
        };
        updated.push({
          level: level + 1,
          parentTitle: title,
          items: uniqueItems,
          image: imageToUse,
          inheritedImage: imageToUse // Pass current image for next level
        });
        return updated;
      });
    } else {
      // Opening first-level menu
      setSidebarOpen(true);
      setSubMenuStack([{
        level: 0,
        parentTitle: title,
        items: uniqueItems,
        image: imageToUse,
        inheritedImage: imageToUse
      }]);
    }

    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleBackClick = (targetLevel: number) => {
    if (isAnimating || subMenuStack.length <= 1) return;
    setIsAnimating(true);
    setSubMenuStack(prev => prev.slice(0, targetLevel + 1));
    setTimeout(() => setIsAnimating(false), 300);
  };

  const closeSidebar = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSidebarOpen(false);
    setTimeout(() => {
      setSubMenuStack([]);
      setIsAnimating(false);
    }, 400);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Check if user has access to a passcode-protected item
  const hasPasscodeAccess = (item: any): boolean => {
    if (!item.requiresPasscode) return true;
    const accessKey = `vip_access_${item.title}`;
    return sessionStorage.getItem(accessKey) === 'true';
  };

  // Handle click on menu item (button or link)
  const handleMenuItemClick = (
    item: any,
    action: () => void,
    levelIndex?: number
  ) => {
    if (item.requiresPasscode && !hasPasscodeAccess(item)) {
      // Show passcode modal
      setPasscodeModal({
        isOpen: true,
        item,
        correctPasscode: item.passcode,
        onVerified: () => {
          setPasscodeModal(null);
          action(); // Execute original action after verification
        }
      });
    } else {
      action(); // No passcode required, execute action
    }
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

  // Get current image - check current level first, then fall back to parent
  const getCurrentImage = () => {
    if (!subMenuStack.length) return null;

    const currentLevel = subMenuStack[subMenuStack.length - 1];

    // Check current level image
    if (currentLevel.image?.asset?.url) {
      return currentLevel.image;
    }

    // Fall back to previous level image
    if (subMenuStack.length > 1) {
      const parentLevel = subMenuStack[subMenuStack.length - 2];
      if (parentLevel.image?.asset?.url) {
        return parentLevel.image;
      }
    }

    return null;
  };



  return (
    <div className={classes}>
      {/* Top navigation */}
      <ul className={styles.navigationItems}>
        {filteredLinks.map(navItem => (
          <li
            key={navItem.title}
            className={classNames(styles.navigationItem, {
              [styles.withSublinks]: navItem.navSublinks?.length,
              [styles.active]: subMenuStack[0]?.parentTitle === navItem.title
            })}
          >
            {navItem.title?.toLowerCase() === 'concierge' ? (
              <button
                className={styles.navigationLink}
                onClick={() => setContactSidebarOpen(true)}
              >
                <span className={styles.navText}>{navItem.title}</span>
              </button>
            ) : (
              <Link
                variant="normal-sm"
                href={navItem.dropdown ? '#' : resolveLink(navItem.link, navItem.title)}
                className={styles.navigationLink}
                onClick={(e) => {
                  if (navItem.navSublinks?.length) {
                    e.preventDefault();
                    openMenu(navItem.navSublinks, navItem.title, navItem.image);
                  }
                }}
              >
                <span className={styles.navText}>{navItem.title}</span>
                {navItem.navSublinks?.length && <Icon title="chevronDown" className={styles.navigationLinkIcon} />}
              </Link>
            )}
          </li>
        ))}

        {display === 'right' && (
          <li>
            <HeaderNavigationCart />
          </li>
        )}
      </ul>

      {/* Overlay */}
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={classNames(styles.sidebar, {
          [styles.sidebarOpen]: sidebarOpen,
          [styles.sidebarAnimating]: isAnimating
        })}
        style={{ width: `${17 + subMenuStack.length * 15}%` }}
      >
        <div className={styles.sidebarContent}>
          {/* Current submenu levels */}
          <div className={styles.menuLevelsWrapper}>
            {subMenuStack.map((menuLevel, levelIndex) => (
              <div
                key={levelIndex}
                className={classNames(styles.menuLevel, {
                  [styles.menuLevelActive]: levelIndex === subMenuStack.length - 1
                })}
                style={{
                  left: `${menuOffsets[levelIndex] || levelIndex * 120}px`
                }}
              >
                <div className={styles.levelLayout}>
                  {/* LEFT: Links */}
                  <ul className={styles.sidebarNavigation}>
                    {deduplicateItems(menuLevel.items).map((item: any, index: number) => {
                      const hasNestedItems = item.navSublinks?.length > 0;
                      const isDropdownItem = hasNestedItems || !item.link;

                      return (
                        <li
                          key={`${item.title}-${index}`}
                          className={classNames(styles.sidebarItem, {
                            [styles.active]: menuLevel.activeItem?.title === item.title
                          })}
                        >
                          {isDropdownItem ? (
                            <button
                              className={classNames(styles.sidebarLinkButton, {
                                [styles.active]: menuLevel.activeItem?.title === item.title
                              })}
                              onClick={() => handleMenuItemClick(
                                item,
                                () => openMenu(
                                  item.navSublinks || [],
                                  item.title,
                                  item.image,
                                  levelIndex,
                                  menuLevel.image // Pass current level image as parent image
                                ),
                                levelIndex
                              )}
                            >
                              <Text text={item.title} />
                              {hasNestedItems && <Icon title="chevronRight" className={styles.submenuIcon} />}
                              {item.requiresPasscode && !hasPasscodeAccess(item) && (
                                <Icon title="lock" className={styles.lockIcon} />
                              )}
                            </button>
                          ) : (
                            <Link
                              href={hasPasscodeAccess(item) ? resolveLink(item.link, item.title) : '#'}
                              className={styles.sidebarLink}
                              onClick={(e) => {
                                if (item.requiresPasscode && !hasPasscodeAccess(item)) {
                                  e.preventDefault();
                                  handleMenuItemClick(item, () => {
                                    window.location.href = resolveLink(item.link, item.title);
                                    closeSidebar();
                                  });
                                } else {
                                  closeSidebar();
                                }
                              }}
                            >
                              <Text text={item.title} />
                              {item.requiresPasscode && !hasPasscodeAccess(item) && (
                                <Icon title="lock" className={styles.lockIcon} />
                              )}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>

                  {/* RIGHT: Image - Use getCurrentImage to show appropriate image */}
                  {getCurrentImage()?.asset?.url && (
                    <div className={styles.levelImageWrapper}>
                      <Image
                        src={getCurrentImage().asset.url}
                        alt={getCurrentImage().alt || menuLevel.parentTitle || 'Menu image'}
                        width={200}
                        height={200}
                        className={styles.levelImage}
                        priority={levelIndex === 0}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Sidebar */}
      <ContactSidebar isOpen={contactSidebarOpen} onClose={() => setContactSidebarOpen(false)} />

      {/* Passcode Modal */}
      {passcodeModal && (
        <PasscodeModal
          isOpen={passcodeModal.isOpen}
          onClose={() => setPasscodeModal(null)}
          onSuccess={passcodeModal.onVerified}
          correctPasscode={passcodeModal.correctPasscode}
          menuTitle={passcodeModal.item.title}
        />
      )}
    </div>
  );
};

export default HeaderNavigation;

