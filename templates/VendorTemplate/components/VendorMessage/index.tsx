import Text from '@/components/Text';
import styles from '../../styles.module.scss';

type VendorMessageProps = {
  title: string;
  text: string;
  children?: React.ReactNode;
};

const VendorMessage = ({ title, text, children }: VendorMessageProps) => (
  <section className={styles.centered}>
    <Text as="h1" size="h1" text={title} />
    <Text as="p" size="b2" className={styles.muted} text={text} />
    {children}
  </section>
);

export default VendorMessage;
