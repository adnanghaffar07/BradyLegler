import type { Metadata } from 'next';
import { hasVendorAccess, isVendorAccessConfigured } from '@/lib/vendor/access';
import { getVendorCatalog, VendorCatalogProduct } from '@/tools/apis/shopify';
import VendorGate from '@/templates/VendorTemplate/components/VendorGate';
import VendorOrder from '@/templates/VendorTemplate/components/VendorOrder';
import VendorMessage from '@/templates/VendorTemplate/components/VendorMessage';

// Private trade page: never cached, indexed or linked from the public site.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vendor Orders | Brady Legler',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } }
};

const VendorPage = async () => {
  if (!isVendorAccessConfigured()) {
    return <VendorMessage title="Vendor orders" text="Vendor ordering is not open yet. Please contact us directly." />;
  }

  if (!hasVendorAccess()) return <VendorGate />;

  let products: VendorCatalogProduct[] | null = null;
  try {
    products = await getVendorCatalog();
  } catch (error) {
    console.error('Vendor page: could not load the catalogue', error);
  }

  if (!products) {
    return (
      <VendorMessage
        title="Vendor orders"
        text="The collection could not be loaded right now. Please refresh the page."
      />
    );
  }

  return <VendorOrder products={products} />;
};

export default VendorPage;
