import Text from '@/components/Text';
import ProductCard from '@/components/ProductCard';
import { GetProductRecommendationsResponse } from '@/tools/apis/shopify';
import { getProductInquiryFlags } from '@/tools/sanity/helpers/getProductInquiryFlags';
import styles from './styles.module.scss';

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const Recommendations = async ({ recommendations }: { recommendations: GetProductRecommendationsResponse }) => {
  if (!recommendations || recommendations.length === 0) return null;

  const shuffledRecommendations = shuffleArray(recommendations);
  const productsToShow = shuffledRecommendations.slice(0, 3);
  const productsCount = productsToShow.length;

  // Fetch inquiry flags for all products
  const handles = productsToShow.map(p => p.handle);
  const inquiryFlags = await getProductInquiryFlags(handles);

  return (
    <section className={styles.recommendationsSection}>
      <div className={styles.container}>
        <Text as="h2" text="You May Also Like" size="b1" className={styles.title} />
        <div className={`${styles.grid} ${styles[`grid-${productsCount}`]}`}>
          {productsToShow.map(product => (
            <div key={product.id} className={styles.productWrapper}>
              <ProductCard 
                shopifyProduct={product}
                inquiryEnabled={inquiryFlags[product.handle]?.inquireButtonEnabled}
                inquirePriceText={inquiryFlags[product.handle]?.inquirePriceText}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Recommendations;