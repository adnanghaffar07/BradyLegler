import classNames from '@/helpers/classNames';
import Text, { TextProps } from '@/components/Text';
import styles from './styles.module.scss';

interface HeadingProps {
  className?: string;
  variant?: 'hero' | 'section' | 'body';
  tagline?: string;
  title: string;
  titleAs?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  theme?: 'primary' | 'secondary';
  subtitle?: string;
  cta?: {
    text: string;
    url: string;
  };
  spacing?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const Heading = (props: HeadingProps) => {
  const {
    title,
    titleAs: titleAsOverride,
    subtitle,
    tagline,
    className,
    spacing = 'md',
    theme = 'primary',
    variant = 'section'
  } = props;
  const classes = classNames(styles.heading, styles[`theme_${theme}`], styles[`spacing_${spacing}`], className);

  const titleByVariant: Record<'hero' | 'section' | 'body', TextProps['as']> = {
    hero: 'h1',
    section: 'h2',
    body: 'h4'
  };

  const titleAs = titleAsOverride || titleByVariant[variant];

  return (
    <div className={classes}>
      {tagline && (
        <Text as="p" className={styles.tagline} text={tagline} />
      )}
      {title && (
        <Text as={titleAs} className={styles.title} text={title} />
      )}
      {subtitle && (
        <Text as="p" className={styles.subtitle} text={subtitle} />
      )}
    </div>
  );
};

export default Heading;
