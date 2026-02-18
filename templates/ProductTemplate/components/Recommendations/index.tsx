import Text from '@/components/Text';
import ProductCard from '@/components/ProductCard';
import { GetProductRecommendationsResponse } from '@/tools/apis/shopify';
import styles from './styles.module.scss';

const Recommendations = ({ recommendations }: { recommendations: GetProductRecommendationsResponse }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const productsToShow = recommendations.slice(0, 3);
  const productsCount = productsToShow.length;

  return (
    <section className={styles.recommendationsSection}>
      <div className={styles.container}>
        <Text as="h2" text="You May Also Like" size="b1" className={styles.title} />
        <div className={`${styles.grid} ${styles[`grid-${productsCount}`]}`}>
          {productsToShow.map(product => (
            <div key={product.id} className={styles.productWrapper}>
              <ProductCard shopifyProduct={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recommendations;