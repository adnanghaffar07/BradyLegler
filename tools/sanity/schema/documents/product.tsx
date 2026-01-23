import { TbTag } from 'react-icons/tb';
import pluralize from 'pluralize-esm';
import ShopifyDocumentStatus from '../../components/media/ShopifyDocumentStatus';
import { defineField, defineType } from 'sanity';
import { getPriceRange } from '../../helpers/getPriceRange';
import { IShopifyProductObject } from '../objects/shopify/shopifyProduct';
import ProductHiddenInput from '../../components/inputs/ProductHidden';
import { SectionLibrary } from '../../components/SectionLibrary';
import ShopifyIcon from '../../components/icons/Shopify';
import { ISeoObject } from '../objects/seo';
import { IGallery } from '../objects/gallery';
import { IFeatureMedia } from '../objects/featureMedia';

interface IProductDocument {
  _id: string;
  store: IShopifyProductObject;
  sections: any[];
  seoData: ISeoObject;
  gallery: IGallery;
  featureMedia: IFeatureMedia;
  description: SanityTextBlock[];
  specification: SanityTextBlock[];
  collectionMedia: IFeatureMedia;
}

const productDocument = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  icon: TbTag,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      default: true
    },
    {
      title: 'Collection',
      name: 'collection'
    },
    {
      title: 'Shopify',
      name: 'shopify',
      icon: ShopifyIcon
    },
    {
      name: 'seo',
      title: 'SEO'
    }
  ],
  fields: [
    defineField({
      name: 'hidden',
      type: 'string',
      components: {
        field: ProductHiddenInput
      },
      group: ['editorial', 'shopify'],
      hidden: ({ parent }) => {
        const isActive = parent?.store?.status === 'active';
        const isDeleted = parent?.store?.isDeleted;
        return !parent?.store || (isActive && !isDeleted);
      }
    }),
    // Title (proxy)
    defineField({
      name: 'titleProxy',
      title: 'Title',
      type: 'proxyString',
      options: { field: 'store.title' },
      hidden: true
    }),
    // Slug (proxy)
    defineField({
      name: 'slugProxy',
      title: 'Slug',
      type: 'proxyString',
      options: { field: 'store.slug.current' },
      hidden: true
    }),
    defineField({
      name: 'store',
      title: 'Shopify',
      type: 'shopifyProduct',
      description: 'Product data from Shopify (read-only)',
      group: 'shopify',
      hidden: true
    }),
    defineField({
      name: 'featureMedia',
      type: 'featureMedia',
      title: 'Feature Media',
      description: 'Add a custom feature media for this product',
      group: 'editorial'
    }),
    defineField({
      name: 'gallery',
      type: 'gallery',
      title: 'Media Gallery',
      description: 'Add images or videos to display',
      group: 'editorial'
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      of: [
        { type: `headerHeroSection` },
        { type: `quoteSection` },
        { type: 'twoColMediaSection' },
        { type: 'twoColTextSection' },
        { type: `videoSection` },
        { type: 'imageCenteredSection' },
        { type: 'fullscreenImageSection' },
        { type: `linksSection` },
        { type: `listArtwork` },
        { type: `announcementSection` },
        { type: 'discoverMoreSection' },
        { type: 'homeCollections' },
        { type: 'productsSection' },
        { type: 'viewedProductsSection' },
        { type: 'productReviewsSection' },
        { type: 'spacerSection' }
      ],
      components: { input: SectionLibrary },
      group: 'editorial'
    }),
    defineField({
      name: 'collectionMedia',
      type: 'featureMedia',
      title: 'Collection Media',
      description: 'Add a custom media for this product that will be displayed on collection pages',
      group: 'collection'
    }),
    defineField({
      name: `seoData`,
      title: `Seo Data`,
      type: `seo`,
      group: 'seo'
    })
  ],
  orderings: [
    {
      name: 'titleAsc',
      title: 'Title (A-Z)',
      by: [{ field: 'store.title', direction: 'asc' }]
    },
    {
      name: 'titleDesc',
      title: 'Title (Z-A)',
      by: [{ field: 'store.title', direction: 'desc' }]
    },
    {
      name: 'priceDesc',
      title: 'Price (Highest first)',
      by: [{ field: 'store.priceRange.minVariantPrice', direction: 'desc' }]
    },
    {
      name: 'priceAsc',
      title: 'Price (Lowest first)',
      by: [{ field: 'store.priceRange.minVariantPrice', direction: 'asc' }]
    }
  ],
  preview: {
    select: {
      isDeleted: 'store.isDeleted',
      options: 'store.options',
      previewImageUrl: 'store.previewImageUrl',
      priceRange: 'store.priceRange',
      status: 'store.status',
      title: 'store.title',
      variants: 'store.variants'
    },
    prepare(selection) {
      const { isDeleted, options, previewImageUrl, priceRange, status, title, variants } = selection;

      const optionCount = options?.length;
      const variantCount = variants?.length;

      let description = [
        variantCount ? pluralize('variant', variantCount, true) : 'No variants',
        optionCount ? pluralize('option', optionCount, true) : 'No options'
      ];

      let subtitle = getPriceRange(priceRange);
      if (status !== 'active') {
        subtitle = '(Unavailable in Shopify)';
      }
      if (isDeleted) {
        subtitle = '(Deleted from Shopify)';
      }

      return {
        description: description.join(' / '),
        subtitle,
        title,
        media: (
          <ShopifyDocumentStatus
            isActive={status === 'active'}
            isDeleted={isDeleted}
            type="product"
            url={previewImageUrl}
            title={title}
          />
        )
      };
    }
  }
});

export default productDocument;
export type { IProductDocument };
