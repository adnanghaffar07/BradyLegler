'use client';

import { useState } from 'react';
import { PortableText } from '@portabletext/react';
import classNames from '@/helpers/classNames';
import Button from '@/components/Button';
import Text, { TextProps } from '@/components/Text';
import Icon from '@/components/Icon';
import Link from '@/components/Link';
import Image from '@/components/Image';
import Video from '@/components/Video';
import useElementHeight from '@/tools/hooks/useElementHeight';
import { ILinkElement } from '@/tools/sanity/schema/elements/link';
import styles from './styles.module.scss';

interface TextBlockComponentConfig {
  size?: TextProps['size'];
  color?: TextProps['color'];
  spacing?: TextProps['spacing'];
  className?: string;
}

export interface TextBlockProps {
  blocks?: SanityTextBlock[];
  readMore?: boolean;
  wordCount?: number;
  color?: ProjectColor;
  className?: string;

  // Config
  config?: {
    block?: TextBlockComponentConfig;
    listBullet?: TextBlockComponentConfig;
    listNumber?: TextBlockComponentConfig;
    listItemNumber?: TextBlockComponentConfig;
    listItemBullet?: TextBlockComponentConfig;
    h1?: TextBlockComponentConfig;
    h2?: TextBlockComponentConfig;
    h3?: TextBlockComponentConfig;
    h4?: TextBlockComponentConfig;
    h5?: TextBlockComponentConfig;
    h6?: TextBlockComponentConfig;
    p?: TextBlockComponentConfig;
    span?: TextBlockComponentConfig;
    blockquote?: TextBlockComponentConfig;
  };
}
interface ComponentProps {
  children: React.ReactElement;
}

const TextBlock = (props: TextBlockProps) => {
  const {
    blocks,
    className,
    color = 'brand-black',
    readMore = false,
    wordCount = 150,
    config: providedConfig = {}
  } = props;
  const [showMore, setShowMore] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);

  const [ref, elementHeight] = useElementHeight({ disabled: !readMore });

  if (!blocks) return null;

  const config: TextBlockProps['config'] = {
    block: {
      size: 'b3',
      color,
      spacing: 'sm',
      ...providedConfig?.block
    },
    span: {
      size: 'b3',
      color,
      spacing: 'md',
      ...providedConfig?.p
    },
    blockquote: {
      size: 'b3',
      color,
      spacing: 'lg',
      ...providedConfig?.p
    },
    p: {
      size: 'b3',
      color,
      spacing: 'md',
      ...providedConfig?.p
    },
    listBullet: {
      size: 'b3',
      color,
      spacing: 'md',
      ...providedConfig?.listBullet
    },
    listItemBullet: {
      size: 'b3',
      color,
      spacing: 'sm',
      ...providedConfig?.listItemBullet
    },
    listNumber: {
      size: 'b3',
      color,
      spacing: 'md',
      ...providedConfig?.listNumber
    },
    listItemNumber: {
      size: 'b3',
      color,
      spacing: 'md',
      ...providedConfig?.listItemNumber
    },
    h1: {
      size: 'h1',
      color,
      spacing: ['xl', 'lg'],
      ...providedConfig?.h1
    },
    h2: {
      size: 'h2',
      color,
      spacing: ['lg', 'lg'],
      ...providedConfig?.h2
    },
    h3: {
      size: 'h2',
      color,
      spacing: ['md', 'sm'],
      ...providedConfig?.h3
    },
    h4: {
      size: 'h2',
      color,
      spacing: ['sm', 'xs'],
      ...providedConfig?.h4
    },
    h5: {
      size: 'h2',
      color,
      spacing: ['sm', 'xs'],
      ...providedConfig?.h5
    },
    h6: {
      size: 'h2',
      color,
      spacing: ['sm', 'xs'],
      ...providedConfig?.h6
    }
  };

  const components = {
    list: {
      bullet: ({ children }: ComponentProps) => (
        <Text as="ul" {...config?.listBullet}>
          {children}
        </Text>
      ),
      number: ({ children }: ComponentProps) => (
        <Text as="ol" {...config?.listNumber}>
          {children}
        </Text>
      )
    },
    listItem: {
      bullet: ({ children }: ComponentProps) => (
        <Text as="li" {...config?.listItemBullet}>
          {children}
        </Text>
      ),
      number: ({ children }: ComponentProps) => (
        <Text as="li" {...config?.listItemNumber}>
          {children}
        </Text>
      )
    },
    block: {
      normal: ({ children }: ComponentProps) => {
        return (
          <Text as="p" {...config?.span}>
            {children}
          </Text>
        );
      },
      blockquote: ({ children }: ComponentProps) => {
        return (
          <Text as="blockquote" {...config?.blockquote}>
            {children}
          </Text>
        );
      },

      span: ({ children }: ComponentProps) => {
        return (
          <Text as="span" {...config?.span}>
            {children}
          </Text>
        );
      },
      p: ({ children }: ComponentProps) => {
        <Text as="p" {...config?.p} spacing="sm">
          {children}
        </Text>;
      },
      h1: ({ children }: ComponentProps) => (
        <Text as="h1" variant="heading" size="lg" {...config?.h1}>
          {children}
        </Text>
      ),
      h2: ({ children }: ComponentProps) => (
        <Text as="h2" variant="heading" {...config?.h2}>
          {children}
        </Text>
      ),
      h3: ({ children }: ComponentProps) => (
        <Text as="h3" variant="heading" {...config?.h3}>
          {children}
        </Text>
      ),
      h4: ({ children }: ComponentProps) => (
        <Text as="h4" variant="heading" {...config?.h4}>
          {children}
        </Text>
      ),
      h5: ({ children }: ComponentProps) => (
        <Text as="h5" {...config?.h5}>
          {children}
        </Text>
      ),
      h6: ({ children }: ComponentProps) => (
        <Text as="h6" {...config?.h6}>
          {children}
        </Text>
      )
    },
    marks: {
      link: (props: ComponentProps & { value: ILinkElement }) => {
        const { children, value } = props || {};
        const internalLink = value?.internalLink;
        const externalLink = value?.externalLink || '';
        const phone = value?.phone || '';
        const email = value?.email || '';
        const action = value?.action || '';
        const linkType = value?.linkType;
        const href = value?.href || ''; // catches links pasted from external sources

        return (
          <Link
            href={href}
            linkType={linkType}
            internalLink={internalLink}
            externalLink={externalLink}
            phone={phone}
            email={email}
            action={action}
            className={styles.link}
          >
            {children}
          </Link>
        );
      },
      strong: ({ children }: ComponentProps) => <strong>{children}</strong>,
      markerFont: ({ children }: ComponentProps) => <span className={styles.markerFont}>{children}</span>
    },
    types: {
      blockContentImage: (props: any) => {
        const { value } = props;
        return (
          <div>
            <Image {...value?.image} sizes="100vw" className={styles.image} />
            <Text as="p" size="md" color="themeColor">
              {value?.caption}
            </Text>
          </div>
        );
      },
      blockContentVideo: (props: any) => {
        const { value } = props;
        if (!value?.videoUrl) return null;
        return <Video url={value.videoUrl} controls />;
      },
      blockContentButtons: (props: any) => {
        const { value } = props;
        const hasButtons = value?.buttons?.length > 0;
        return hasButtons
          ? value.buttons.map((button: any, index: number) => {
              const buttonLink = button?.link || {};
              return (
                <Link
                  key={index}
                  linkType={buttonLink?.linkType}
                  internalLink={buttonLink?.internalLink}
                  externalLink={buttonLink?.externalLink}
                  phone={buttonLink?.phone}
                  email={buttonLink?.email}
                  action={buttonLink?.action}
                  title={button?.label}
                  variant="square"
                  size="md"
                  theme="primary"
                >
                  <Text text={button?.label} weight="medium" />
                </Link>
              );
            })
          : null;
      },
      divider: () => {
        return <div className={styles.divider} />;
      }
    }
  };

  // Possible way to create a more intelligent readMore use plain text
  // const plainText = toPlainText(blocks);

  if (!blocks || blocks.length < 1) return null;

  const content = blocks?.reduce<{
    blocks: SanityTextBlock[];
    blocksHidden: SanityTextBlock[];
    countTotal: number;
    readMoreEnabled: boolean;
  }>(
    (blocksData, block) => {
      const wordsCountParagraph = block?.children?.reduce<number>((countParagraph, blockChild) => {
        if (!blockChild?.text?.length) return countParagraph;
        const countWord = blockChild?.text.split(' ').length;
        return countParagraph + countWord;
      }, 0);
      const countTotal = blocksData.countTotal + wordsCountParagraph;
      blocksData.countTotal = countTotal;
      if (readMore && countTotal > wordCount) blocksData.readMoreEnabled = true;
      if (!readMore || countTotal < wordCount) {
        blocksData.blocks.push(block);
      } else {
        blocksData.blocksHidden.push(block);
      }
      return blocksData;
    },
    { blocks: [], blocksHidden: [], countTotal: 0, readMoreEnabled: false }
  );

  const toggleReadMore = () => {
    if (!showMore) {
      setScrollPosition(window.scrollY);
      setShowMore(!showMore);
    } else {
      window.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });

      setTimeout(() => {
        setShowMore(!showMore);
      }, 500);
    }
  };

  return (
    <div className={className}>
      <PortableText value={content?.blocks} components={components} />

      {content?.blocksHidden?.[0] && (
        <div
          className={classNames(styles.hiddenContent, { [styles.viewHiddenContent]: showMore })}
          style={{ maxHeight: showMore && elementHeight ? elementHeight : 0 }}
        >
          <div ref={ref} className={styles.hiddenContentContainer}>
            <PortableText value={content?.blocksHidden} components={components} />
          </div>
        </div>
      )}

      {content?.readMoreEnabled && (
        <Button
          onClick={toggleReadMore}
          className={classNames(styles.readMore, { [styles.active]: showMore })}
          ariaLabel="Read more"
        >
          <Text text={showMore ? 'Read less' : 'Read more'} size="lg" color={color || 'themeColor'} weight="medium" />
          <Icon title="chevronDown" size="lg" className={styles.icon} color="themeColor" />
        </Button>
      )}
    </div>
  );
};

export default TextBlock;
