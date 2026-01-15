import { TbPackage } from 'react-icons/tb';
import { defineField, defineType } from 'sanity';
import pluralize from 'pluralize-esm';
import CollectionHiddenInput from '../../components/inputs/CollectionHidden';
import ShopifyDocumentStatus from '../../components/media/ShopifyDocumentStatus';
import { IShopifyCollectionObject } from '../objects/shopify/shopifyCollection';
import { SectionLibrary } from '../../components/SectionLibrary';
import ShopifyIcon from '../../components/icons/Shopify';
import { ISeoObject } from '../objects/seo';
import { ICollectionHeader } from '../objects/collectionHeader';

interface ICollectionDocument {
  _id: string;
  store: IShopifyCollectionObject;
    collectionStory?: string; // Add this
  collectionHeader: ICollectionHeader;
  sections: any[];
  sectionsMiddle: any[];
  quote: any[];
  quotes: {
    content: any[];
  }[];
  seoData: ISeoObject;
  layout: 'fluidAndGrid' | 'list';
}

const collectionDocument = defineType({
  name: 'collection',
  title: 'Collection',
  type: 'document',
  icon: TbPackage,
  groups: [
    {
      title: 'Editorial',
      name: 'editorial',
      default: true
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
      name: 'collectionStory',
      title: 'Collection Story',
      type: 'text',
      rows: 4,
      description: 'The story/narrative for this collection. This will appear on product pages.',
      group: 'editorial'
    }),

    // Collection hidden status
    defineField({
      name: 'hidden',
      type: 'string',
      components: {
        field: CollectionHiddenInput
      },
      group: ['editorial', 'shopify'],
      hidden: ({ parent }) => {
        const isDeleted = parent?.store?.isDeleted;
        return !isDeleted;
      }
    }),
    // Title (proxy)
    defineField({
      name: 'titleProxy',
      title: 'Title',
      type: 'proxyString',
      options: { field: 'store.title' }
    }),
    // Slug (proxy)
    defineField({
      name: 'slugProxy',
      title: 'Slug',
      type: 'proxyString',
      options: { field: 'store.slug.current' }
    }),
    // Shopify collection
    defineField({
      name: 'store',
      title: 'Shopify',
      type: 'shopifyCollection',
      description: 'Collection data from Shopify (read-only)',
      group: 'shopify',
      hidden: true
    }),
    defineField({
      name: 'collectionHeader',
      title: 'Collection Header',
      type: 'collectionHeader',
      group: 'editorial'
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      description: 'Select the layout of the collection',
      type: 'string',
      options: {
        list: [
          { title: 'Fluid & Grid', value: 'fluidAndGrid' },
          { title: 'List', value: 'list' }
        ],
        layout: 'dropdown'
      },
      initialValue: 'fluidAndGrid',
      group: 'editorial',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      description:
        'Insert a single quote to be displayed on the collection page. Quote will be displayed when the collection page view mode is set to "List"',
      type: 'blockContentSimple',
      group: 'editorial',
      hidden: ({ parent }) => parent?.layout !== 'list'
    }),
    defineField({
      name: 'quotes',
      title: 'Quotes',
      description:
        'Insert quotes to be displayed on the collection page. Quotes will be displayed when the collection page view mode is set to "Fluid with Quotes & Grid"',
      type: 'array',
      of: [{ type: 'quote' }],
      group: 'editorial',
      validation: Rule => Rule.max(5),
      hidden: ({ parent }) => parent?.layout !== 'fluidAndGrid'
    }),
    defineField({
      name: `sectionsMiddle`,
      title: `Middle Sections`,
      description: `Add sections to the middle of the collection page`,
      type: `array`,
      of: [{ type: `quoteSection` }, { type: 'fullscreenImageSection' }, { type: `videoSection` }],
      components: { input: SectionLibrary },
      group: 'editorial',
      hidden: ({ parent }) => parent?.layout === 'list'
    }),
    defineField({
      name: `sections`,
      title: `Bottom Sections`,
      description: `Add sections to the bottom of the collection page`,
      type: `array`,
      of: [
        { type: `quoteSection` },
        { type: 'twoColMediaSection' },
        { type: `videoSection` },
        { type: 'imageCenteredSection' },
        { type: 'twoColTextSection' },
        { type: `linksSection` },
        { type: `announcementSection` },
        { type: 'discoverMoreSection' }
      ],
      components: { input: SectionLibrary },
      group: 'editorial'
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
    }
  ],
  preview: {
    select: {
      imageUrl: 'store.imageUrl',
      isDeleted: 'store.isDeleted',
      rules: 'store.rules',
      title: 'store.title'
    },
    prepare(selection) {
      const { imageUrl, isDeleted, rules, title } = selection;
      const ruleCount = rules?.length || 0;

      return {
        media: <ShopifyDocumentStatus isDeleted={isDeleted} type="collection" url={imageUrl} title={title} />,
        subtitle: ruleCount > 0 ? `Automated (${pluralize('rule', ruleCount, true)})` : 'Manual',
        title
      };
    }
  }
});

export default collectionDocument;
export type { ICollectionDocument };
