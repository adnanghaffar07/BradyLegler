import Layout from '@/components/Layout';
import ProductCard from '@/components/ProductCard';
import Text from '@/components/Text';
import { getProducts, ShopifyProduct } from '@/tools/apis/shopify';
import { sanityFetch } from '@/tools/sanity/lib/fetch';
import { CUSTOMIZABLE_PRODUCTS_QUERY, PRODUCTS_QUERY } from '@/tools/sanity/lib/queries.groq';
import { CUSTOMIZABLE_PRODUCT_HANDLES } from '@/templates/ProductTemplate/components/SubwayRingCustomizer/customizableProducts';
import gridStyles from '@/templates/CollectionTemplate/components/ProductsGrid/styles.module.scss';
import styles from './styles.module.scss';

type CustomizableSanityProduct = {
  handle: string;
  id: string;
  inquireButtonEnabled?: boolean | null;
  inquirePriceText?: string | null;
};

type CustomizableCard = {
  product: ShopifyProduct & Record<string, unknown>;
  inquireButtonEnabled?: boolean | null;
  inquirePriceText?: string | null;
};

/**
 * Loads the customizable pieces the same way a collection page does: Shopify for the
 * product itself (which only returns products that are live, so drafts never show),
 * with the Sanity gallery and collection media merged in for the card imagery.
 */
const getCustomizableCards = async (): Promise<CustomizableCard[]> => {
  const sanityProducts = await sanityFetch<CustomizableSanityProduct[]>({
    query: CUSTOMIZABLE_PRODUCTS_QUERY,
    params: { handles: CUSTOMIZABLE_PRODUCT_HANDLES }
  });
  const productIds = (sanityProducts ?? []).map(product => product.id).filter(Boolean);
  if (!productIds.length) return [];

  const [shopifyProducts, sanityMedia] = await Promise.all([
    getProducts(productIds),
    sanityFetch<any[]>({ query: PRODUCTS_QUERY, params: { productIds } })
  ]);

  return CUSTOMIZABLE_PRODUCT_HANDLES.flatMap(handle => {
    const shopifyProduct = shopifyProducts?.find(product => product.handle === handle);
    if (!shopifyProduct) return [];

    const sanityProduct = sanityProducts.find(product => product.handle === handle);
    const media = sanityMedia?.find(product => product.id === shopifyProduct.id);

    return [
      {
        product: {
          ...shopifyProduct,
          ...(media?.collectionMedia ? { collectionMedia: media.collectionMedia } : {}),
          ...(media?.gallery ? { gallery: media.gallery } : {})
        },
        inquireButtonEnabled: sanityProduct?.inquireButtonEnabled,
        inquirePriceText: sanityProduct?.inquirePriceText
      }
    ];
  });
};

const CustomizeTemplate = async () => {
  const cards = await getCustomizableCards();

  return (
    <div className={styles.page}>
      <header className={styles.intro}>
        <Text as="h1" size="b1" text="Customize" />
        <Text
          as="p"
          size="b2"
          className={styles.muted}
          text="Make a piece your own. Choose the metal, then the stones or enamel for each side."
        />
      </header>

      {cards.length === 0 ? (
        <div className={styles.empty}>
          <Text size="b2" text="No customizable pieces are available right now." />
        </div>
      ) : (
        <Layout
          variant="grid"
          className={`${gridStyles.productGrid} ${cards.length <= 2 ? gridStyles.centeredGrid : ''}`.trim()}
        >
          {cards.map(({ product, inquireButtonEnabled, inquirePriceText }) => (
            <ProductCard
              key={product.id}
              shopifyProduct={product}
              overlayDetailsOnMobile={false}
              inquiryEnabled={Boolean(inquireButtonEnabled)}
              inquirePriceText={inquirePriceText ?? undefined}
            />
          ))}
        </Layout>
      )}
    </div>
  );
};

export default CustomizeTemplate;
