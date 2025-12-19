import React from 'react';
import TextBlock from '@/components/TextBlock';
import Layout from '@/components/Layout';
import styles from './styles.module.scss';

type QuoteOverlayProps = {
  quote: any[];
  show?: boolean;
  itemsCount: number;
};

const QuoteOverlay: React.FC<QuoteOverlayProps> = props => {
  const { quote, show = true, itemsCount } = props;
  if (!show) return null;

  return (
    <div className={styles.container}>
      <Layout
        variant="container"
        className={styles.layout}
        style={{ height: `${100 / (itemsCount + 1)}%`, top: `${(100 / (itemsCount + 1)) * 0.5}%` }}
      >
        <div className={styles.block}>
          <TextBlock
            config={{
              p: {
                size: 'b3'
              }
            }}
            blocks={quote}
          />
        </div>
      </Layout>
    </div>
  );
};

export default QuoteOverlay;