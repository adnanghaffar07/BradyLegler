'use client';

import NextLink from 'next/link';
import React from 'react';
import Text from '../Text';
import classNames from '@/helpers/classNames';
import stringClean from '@/tools/helpers/stringClean';
import { ILinkElement } from '@/tools/sanity/schema/elements/link';
import { useContactSidebar } from '@/tools/hooks/useContactSidebar';
import styles from '../Button/styles.module.scss';

export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  children?: React.ReactNode;
  className?: string;
  id?: string;
  href?: string;
  text?: string;
  title?: string;
  linkType?: ILinkElement['linkType'];
  externalLink?: ILinkElement['externalLink'];
  internalLink?: ILinkElement['internalLink'];
  phone?: string;
  email?: string;
  action?: string;
  target?: '_blank' | '_self' | '_parent' | '_top' | string;
  newWindow?: boolean;
  variant?:
    | 'normal-sm'
    | 'normal-sm-light'
    | 'normal-sm-overlay'
    | 'normal-md'
    | 'normal-md-light'
    | 'square'
    | 'square-overlay'
    | 'square-overlay-light'
    | 'content';
  outline?: boolean;
  disabled?: boolean;
}

const Link = (props: LinkProps) => {
  const {
    children,
    className,
    id,
    href,
    text,
    title = '',
    linkType: rawLinkType,
    internalLink,
    phone,
    email,
    action,
    externalLink,
    target = '_self',
    newWindow = false,
    variant,
    disabled = false,
    size,
    theme,
    outline = false,
    ...rest
  } = props;

  const { openContactSidebar } = useContactSidebar();

  const linkType = stringClean(rawLinkType);

  const classes = classNames(
    styles.button,
    className,
    { [styles[`size_${size}`]]: !!size },
    { [styles[`variant_${variant}`]]: !!variant },
    { [styles[`theme_${theme}`]]: !!theme },
    { [styles.outline]: outline },
    { [styles.disabled]: disabled }
  );

  const linkTarget = newWindow ? '_blank' : target;
  const child = children || text || title;

  if (!child) return null;

  if (linkType === 'internal' || !linkType) {
    let linkHref = internalLink?.pathname || internalLink?.pathnameShopify || href;

    if (!linkHref) {
      return (
        <span className={classes} id={id} {...rest}>
          {child}
        </span>
      );
    }

    if (linkHref === '/home/') linkHref = '/';

    return (
      <NextLink href={linkHref} className={classes} id={id} title={title} target={linkTarget} prefetch={true} {...rest}>
        {children || <Text as="span" text={text || title} />}
      </NextLink>
    );
  }

  if (linkType === 'external') {
    const linkHref = externalLink || href;
    const isRelative = linkHref?.startsWith('/') || linkHref?.indexOf(process.env.NEXT_PUBLIC_SITE_URL!!) !== -1;
    if (isRelative && linkHref) {
      return (
        <NextLink
          href={linkHref}
          className={classes}
          id={id}
          title={title}
          target={linkTarget}
          prefetch={true}
          {...rest}
        >
          {children || <Text as="span" text={text || title} />}
        </NextLink>
      );
    }
    return (
      <a
        href={linkHref}
        className={classes}
        id={id}
        title={title}
        target={linkTarget}
        rel="nofollow noreferrer"
        {...rest}
      >
        {children || <Text as="span" text={text || title} />}
      </a>
    );
  }

  if (linkType === 'phone' || phone) {
    return (
      <a href={`tel:${phone || href}`} className={classes} id={id} title={title} target={linkTarget} {...rest}>
        {children || <Text as="span" text={text || title} />}
      </a>
    );
  }

  if (linkType === 'email' || email) {
    return (
      <a href={`mailto:${email || href}`} className={classes} id={id} title={title} target={linkTarget} {...rest}>
        {children || <Text as="span" text={text || title} />}
      </a>
    );
  }

  if (linkType === 'action') {
    const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (action === 'openContactSidebar') {
        openContactSidebar();
      }
      rest.onClick?.(e as any);
    };

    return (
      <button className={classes} id={id} title={title} onClick={handleActionClick} {...rest}>
        {children || <Text as="span" text={text || title} />}
      </button>
    );
  }

  return (
    <span className={classes} id={id} {...rest}>
      {child}
    </span>
  );
};

export default Link;
