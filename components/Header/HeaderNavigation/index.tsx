'use client';

import React, { useState, useRef, useEffect } from 'react';
import classNames from '@/helpers/classNames';
import HeaderNavigationCart from './HeaderNavigationCart';
import Link from '@/components/Link';
import Icon from '@/components/Icon';
import Text from '@/components/Text';
import Image from 'next/image';
import styles from './styles.module.scss';
import ContactSidebar from '@/components/ContactSidebar/ContactSidebar';
import PasscodeModal from '@/components/PasscodeModal';
import { useContactSidebar } from '@/tools/hooks/useContactSidebar';

type SubMenuState = {
  level: number;
  parentTitle: string;
  items: any[];
  activeItem?: any;
  image?: any;
  inheritedImage?: any; // Track inherited image from parent
  hoveredItemIndex?: number | null; // Track hovered item in this level
};

interface HeaderNavigationProps {
  className?: string;
  display: 'left' | 'right' | 'all';
  navItems?: any[];
}

const HeaderNavigation = ({ className, display, navItems: propNavItems = [] }: HeaderNavigationProps) => {
  const classes = classNames(styles.container, className);
  const [navItems] = useState<any[]>(propNavItems);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subMenuStack, setSubMenuStack] = useState<SubMenuState[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const { isOpen: contactSidebarOpen, openContactSidebar, closeContactSidebar } = useContactSidebar();
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

  const filteredLinks = navItems.filter(navItem => navItem.side === display || display === 'all');

  // Deduplicate items by title (what user sees) - only remove exact duplicates within same level
  const deduplicateItems = (items: any[]) => {
    if (!items || !Array.isArray(items)) return [];
    
    const seen = new Map();
    const deduplicated: any[] = [];
    
    items.forEach((item) => {
      // Ensure item has a title
      if (!item.title) {
        console.warn('Item without title found in navigation:', item);
        return;
      }
      
      // Use title as the primary key for deduplication since that's what's visible
      const key = item.title.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.set(key, true);
        deduplicated.push(item);
      }
    });
    
    return deduplicated;
  };

  // Open menu at any level
  const openMenu = (items: any[], title: string, image?: any, level?: number, parentImage?: any) => {
    if (isAnimating || !items?.length) {
      // If trying to open an empty menu, don't proceed
      if (!items || items.length === 0) {
        return;
      }
    }

    setIsAnimating(true);

    // Deduplicate items
    const uniqueItems = deduplicateItems(items);

    // Determine which image to use: current item's image or inherited from parent
    const imageToUse = image || parentImage;

    if (level !== undefined) {
      // Opening nested menu - keep previous levels
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

  // Handle hover on menu items to update the displayed image
  const handleItemHover = (levelIndex: number, itemIndex: number | null) => {
    setSubMenuStack(prev => {
      const updated = [...prev];
      if (updated[levelIndex]) {
        updated[levelIndex] = {
          ...updated[levelIndex],
          hoveredItemIndex: itemIndex
        };
      }
      return updated;
    });
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

    // If it's an external link
    if (link.linkType === 'external') {
      return link.externalLink || link.href || '#';
    }

    // If it's an action link
    if (link.linkType === 'action') {
      return '#';
    }

    // Handle internal links - prioritize fetched data from backend
    if (link.linkType === 'internal' && link.internalLink) {
      const internalLink = link.internalLink;

      // Always use fetched pathname first (contains full path)
      if (internalLink.pathname) {
        return internalLink.pathname;
      }

      // Then use fetched slug (coalesced from store.slug, slug, or pathname)
      if (internalLink.slug) {
        return `/${internalLink.slug}`;
      }
    }

    // Fallback to title-based slug generation only if no backend data
    if (itemTitle) {
      return `/${generateSlug(itemTitle)}`;
    }

    return '#';
  };

  // Get current image - check hovered item first, then current level, then fall back to parent
  const getCurrentImage = () => {
    if (!subMenuStack.length) return null;

    const currentLevel = subMenuStack[subMenuStack.length - 1];

    // Check if there's a hovered item with an image
    if (currentLevel.hoveredItemIndex !== null && currentLevel.hoveredItemIndex !== undefined) {
      const hoveredItem = currentLevel.items[currentLevel.hoveredItemIndex];
      if (hoveredItem?.image?.asset?.url) {
        return hoveredItem.image;
      }
    }

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
                type="button"
                className={styles.navigationLink}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openContactSidebar();
                }}
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
                    {menuLevel.items.map((item: any, index: number) => {
                      const hasNestedItems = item.navSublinks?.length > 0;
                      const hasLink = item.link && item.link.linkType;
                      const isDropdownItem = hasNestedItems || !hasLink;

                      // Skip items that have neither link nor nested items
                      if (!isDropdownItem && !hasLink && !hasNestedItems) {
                        return null;
                      }

                      return (
                        <li
                          key={`${item.title}-${index}`}
                          className={classNames(styles.sidebarItem, {
                            [styles.active]: menuLevel.activeItem?.title === item.title
                          })}
                          onMouseEnter={() => handleItemHover(levelIndex, index)}
                          onMouseLeave={() => handleItemHover(levelIndex, null)}
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
      <ContactSidebar isOpen={contactSidebarOpen} onClose={closeContactSidebar} />

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

