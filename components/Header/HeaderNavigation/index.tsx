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

type SubMenuState = {
  level: number;
  parentTitle: string;
  items: any[];
  activeItem?: any;
  image?: any;
};
type ContactLink = {
  label: string;
  link: any; // keep `any` or type more strictly if you know the shape
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


const HeaderNavigation = ({ className, display }: { className?: string; display: 'left' | 'right' | 'all' }) => {
  const classes = classNames(styles.container, className);
  const [navItems, setNavItems] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subMenuStack, setSubMenuStack] = useState<SubMenuState[]>([]);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [contactSidebarOpen, setContactSidebarOpen] = useState(false);
  const [contactSectionData, setContactSectionData] = useState<ContactLinksSection | null>(null);


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

  const filteredLinks = navItems.filter(navItem => navItem.side === display || display === 'all');

  // Open first-level submenu
  const openMenu = (navItem: any) => {
    if (isAnimating || !navItem.navSublinks?.length) return;

    setIsAnimating(true);
    setSidebarOpen(true);
    setSubMenuStack([
      {
        level: 0,
        parentTitle: navItem.title,
        items: navItem.navSublinks,
        image: navItem.image
      }
    ]);

    setTimeout(() => setIsAnimating(false), 400);
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
        items: sublink.navSublinks,
        image: sublink.image // <-- include image here
      });
      return updated;
    });
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

  const handleClickOutside = (event: MouseEvent) => {
    if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
      closeSidebar();
    }
  };

  useEffect(() => {
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

  const getCurrentLevel = () => subMenuStack[subMenuStack.length - 1];

  // Helper function to convert text to URL-friendly slug
  const generateSlug = (text: string) => {
    if (!text) return '#';

    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start of text
      .replace(/-+$/, ''); // Trim - from end of text
  };

  const resolveLink = (link: any, itemTitle?: string) => {
    if (!link) return '#';

    console.log('Resolving link:', link);

    // Handle external links
    if (link.linkType === 'external') {
      return link.href || '#';
    }

    // Handle internal links
    if (link.linkType === 'internal') {
      const internalLink = link.internalLink;

      if (!internalLink) {
        console.log('No internal link found');
        return '#';
      }

      // Handle Collection documents specifically
      if (internalLink._type === 'collection') {
        // First try existing handle/slug
        if (internalLink.handle) return `/${internalLink.handle}`;
        if (internalLink.slug) return `/${internalLink.slug}`;

        // Fallback: use the item title to generate slug
        if (itemTitle) {
          const generatedSlug = generateSlug(itemTitle);
          console.log(`Generated slug from title "${itemTitle}": /${generatedSlug}`);
          return `/${generatedSlug}`;
        }

        // If no title available, try internalLink title
        if (internalLink.title) {
          const generatedSlug = generateSlug(internalLink.title);
          console.log(`Generated slug from internal title "${internalLink.title}": /${generatedSlug}`);
          return `/${generatedSlug}`;
        }

        console.warn('Collection link has no handle, slug, or title');
        return '#';
      }

      // Handle other document types (pages, products, etc.)
      if (internalLink.pathname) {
        return internalLink.pathname;
      }

      if (internalLink.slug) {
        if (internalLink.slug === '') return '/';
        return `/${internalLink.slug}`;
      }

      // For other internal links without slug/pathname, try title fallback
      if (itemTitle) {
        const generatedSlug = generateSlug(itemTitle);
        console.log(`Generated slug for ${internalLink._type} from title "${itemTitle}": /${generatedSlug}`);
        return `/${generatedSlug}`;
      }

      if (internalLink.title) {
        const generatedSlug = generateSlug(internalLink.title);
        console.log(
          `Generated slug for ${internalLink._type} from internal title "${internalLink.title}": /${generatedSlug}`
        );
        return `/${generatedSlug}`;
      }

      console.warn(`Linked ${internalLink._type} has no pathname, slug, or title`);
      return '#';
    }

    return '#';
  };

  // Better validation function
  const hasValidLink = (item: any) => {
    if (!item?.link) return false;

    const link = item.link;

    if (link.linkType === 'external' && link.href) return true;

    if (link.linkType === 'internal' && link.internalLink) {
      const internal = link.internalLink;
      // Check if internal link has at least some identifying data
      return !!(internal.pathname || internal.slug || internal._type);
    }

    return false;
  };

  const renderContactSidebar = () => {
    if (!contactSectionData) return null;

    const { links = [], additionalLinks = {} } = contactSectionData;

    // Helper function to handle different types of links
    const handleLinkClick = (link: any, label: string) => {
      if (!link) return;

      // Check if it's a phone number
      const cleanLabel = label?.trim().toLowerCase();
      const isPhoneNumber = /^[\d\s\+\-\(\)]{5,}$/.test(cleanLabel) ||
        cleanLabel.includes('phone') ||
        cleanLabel.includes('call') ||
        cleanLabel.includes('tel');

      // Check if it's an email
      const isEmail = cleanLabel.includes('@') ||
        cleanLabel.includes('email') ||
        cleanLabel.includes('mail');

      if (isPhoneNumber) {
        // Extract numbers from the label for phone calls
        const phoneNumber = cleanLabel.replace(/[^\d\+]/g, '');
        if (phoneNumber) {
          window.location.href = `tel:${phoneNumber}`;
        }
      } else if (isEmail) {
        // Handle email links
        const emailAddress = cleanLabel.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)?.[0];
        if (emailAddress) {
          window.location.href = `mailto:${emailAddress}`;
        }
      } else {
        // Regular link
        const url = resolveLink(link, label);
        if (url && url !== '#') {
          window.open(url, '_blank');
        }
      }
    };

    return (
      <div className={styles.contactSidebarInner}>
        {/* Header with cross button */}
        <div className={styles.contactHeader}>
          <h2 className={styles.contactHeading}>Contact Us</h2>
          <button
            className={styles.closeButton}
            onClick={() => setContactSidebarOpen(false)}
            aria-label="Close contact sidebar"
          >
            <Icon title="close" className={styles.closeIcon} />
          </button>
        </div>

        <p className={styles.contactDescription}>
          Our team of experts is available to answer all your questions from assistance with your orders to style
          advice and gift ideas.
        </p>

        <div className={styles.linksWrapper}>
          {links.map((group, i) => (
            <div key={i} className={styles.contactGroup}>
              {group.groupTitle && <h4 className={styles.groupTitle}>{group.groupTitle}</h4>}

              {group.links?.map((item, idx) => (
                <button
                  key={idx}
                  className={classNames(styles.contactRow, {
                    [styles.phoneLink]: /phone|call|tel|\d{5,}/i.test(item.label),
                    [styles.emailLink]: /@|email|mail/i.test(item.label)
                  })}
                  onClick={() => handleLinkClick(item.link, item.label)}
                >
                  <span>{item.label}</span>
                  <Icon
                    title="chevronRight"
                    className={styles.navigationLinkIcon}
                  />
                </button>
              ))}
            </div>
          ))}

          {(additionalLinks?.links ?? []).length > 0 && (
            <div className={styles.contactGroup}>
              {additionalLinks.groupTitle && <h4 className={styles.groupTitle}>{additionalLinks.groupTitle}</h4>}

              {(additionalLinks.links ?? []).map((item, idx) => (
                <button
                  key={idx}
                  className={classNames(styles.contactRow, {
                    [styles.phoneLink]: /phone|call|tel|\d{5,}/i.test(item.label),
                    [styles.emailLink]: /@|email|mail/i.test(item.label)
                  })}
                  onClick={() => handleLinkClick(item.link, item.label)}
                >
                  <span>{item.label}</span>
                  <Icon title="chevronRight" className={styles.navigationLinkIcon} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
              [styles.active]: getCurrentLevel()?.parentTitle === navItem.title
            })}
          >
            {navItem.title?.toLowerCase() === "contact" ? (
              <button
                className={styles.navigationLink}
                onClick={async e => {
                  e.preventDefault();
                  e.stopPropagation();

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

                  console.log('Fetched contact page data:', contactData);
                  const linksSection = contactData?.sections?.find((s: any) => s._type === 'linksSection');
                  console.log('Extracted linksSection:', linksSection);

                  setContactSectionData(linksSection || null);
                  setContactSidebarOpen(true);
                }}
              >
                {/* Remove Text component and use plain text for Contact button */}
                <span className={styles.navText}>{navItem.title}</span>
              </button>
            ) : (
              <Link
                variant="normal-sm"
                href={navItem.dropdown ? '#' : resolveLink(navItem.link, navItem.title)}
                className={styles.navigationLink}
                onClick={e => {
                  if (navItem.navSublinks?.length) {
                    e.preventDefault();
                    e.stopPropagation();
                    openMenu(navItem);
                  }
                }}
              >
                {/* Also use span for other links to match */}
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
        style={{
          width: `${15 + subMenuStack.length * 15}%` // base 28% + 25% per nested menu
        }}
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
                style={{ left: `${levelIndex * 250}px` }}
              >
                <div className={styles.levelLayout}>
                  {/* LEFT: Links */}
                  <ul className={styles.sidebarNavigation}>
                    {menuLevel.items.map((item: any) => (
                      <li
                        key={item.title}
                        className={classNames(styles.sidebarItem, {
                          [styles.active]: menuLevel.activeItem === item
                        })}
                      >
                        {item.navSublinks?.length ? (
                          <button
                            className={classNames(styles.sidebarLinkButton, {
                              [styles.active]: menuLevel.activeItem === item
                            })}
                            onClick={() => openSubMenu(item, levelIndex)}
                          >
                            <Text text={item.title} />
                            {item.navSublinks?.length && <Icon title="chevronRight" className={styles.submenuIcon} />}
                          </button>
                        ) : (
                          <Link
                            href={resolveLink(item.link, item.title)}
                            className={styles.sidebarLink}
                            onClick={closeSidebar}
                          >
                            <Text text={item.title} />
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* RIGHT: Image */}
                  {menuLevel.image?.asset?.url && (
                    <div
                      className={classNames(styles.levelImageWrapper, {
                        [styles.imageAnimating]: sidebarOpen
                      })}
                    >
                      {' '}
                      <Image
                        src={menuLevel.image.asset.url}
                        alt={menuLevel.image.alt || menuLevel.parentTitle || 'Menu image'}
                        width={300}
                        height={400}
                        className={styles.levelImage}
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
      {contactSidebarOpen && (
        <>
          <div
            className={classNames(styles.overlay, styles.contactOverlay)}
            onClick={() => setContactSidebarOpen(false)}
          />

          <div
            className={classNames(styles.sidebarRight, {
              [styles.sidebarOpen]: contactSidebarOpen
            })}
          >
            <div className={styles.sidebarContent}>
              {renderContactSidebar()}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HeaderNavigation;