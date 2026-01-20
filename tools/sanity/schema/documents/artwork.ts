import slugify from 'slugify';
import { TbDatabase, TbSearch, TbWriting } from 'react-icons/tb';
import { defineType } from 'sanity';
import { SectionLibrary } from '../../components/SectionLibrary';
import { ISeoObject } from '../objects/seo';

interface IArtwork {
  // Sanity fields
  _id: string;
  _createdAt: string;
  _updatedAt: string;

  // Defined fields
  title: string;
  specification: string;
  status: 'onSale' | 'sold';
  content: SanityTextBlock[];
  slug: {
    current: string;
  };
  pathname: string;
  publishDate: string;
  categories: any[];
  featureImage: SanityImage;
  sections: any[];
  seoData: ISeoObject;
}

const artwork = defineType({
  name: `artwork`,
  title: `Artwork`,
  type: `document`,
  icon: TbWriting,
  groups: [
    {
      name: 'data',
      title: 'Data',
      default: true,
      icon: TbDatabase
    },
    {
      name: 'content',
      title: 'Content',
      icon: TbWriting
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: TbSearch
    }
  ],
  fields: [
    {
      name: 'title',
      title: 'Title',
      description: 'The artwork title.',
      type: 'string',
      group: 'data',
      validation: Rule => Rule.required()
    },
    {
      name: 'status',
      title: 'Status',
      description: 'The status of the artwork',
      type: 'string',
      initialValue: 'onSale',
      group: 'data',
      options: {
        list: [
          { title: 'On Sale', value: 'onSale' },
          { title: 'Sold', value: 'sold' }
        ],
        layout: 'select'
      }
    },
    {
      name: `slug`,
      title: `Slug`,
      description:
        '/gallery will be automatically added to the back of the url. Please ensure forward slash / is added to beginning and end of the slug e.g. /example-post/',
      type: `slugElement`,
      options: {
        source: 'title',
        slugify: (input: string) => `/${slugify(input, { lower: true, strict: true })}/`,
        prefix: '/gallery'
      },
      group: 'data'
    },
    {
      name: 'specification',
      title: 'Specification',
      description: 'The artwork specification',
      type: 'string',
      group: 'data'
    },
    {
      name: `content`,
      title: `Description`,
      description: `The artwork description`,
      type: `blockContentSimple`,
      group: 'data'
    },
    {
      name: `pathname`,
      title: `Pathname`,
      type: `string`,
      group: 'data',
      readOnly: true,
      hidden: () => process.env.NODE_ENV === 'production'
    },
    {
      name: 'featureImage',
      title: 'Feature Image',
      type: 'imageElementSimple',
      group: 'data',
      validation: Rule => Rule.required()
    },
    // @ts-ignore
    {
      name: `sections`,
      title: `Sections`,
      type: `array`,
      of: [
        { type: `headerHeroSection` },
        { type: `quoteSection` },
        { type: 'imageCenteredSection' },
        { type: 'discoverMoreSection' },
        { type: 'homeCollections' }
      ],
      components: { input: SectionLibrary },
      group: 'data'
    },
    {
      name: `seoData`,
      title: `Seo Data`,
      type: `seo`,
      group: 'seo'
    }
  ],
  preview: {
    select: {
      title: `title`,
      pathname: `pathname`,
      media: `featureImage.image`
    },
    prepare(selection) {
      const { title, pathname, media } = selection;
      return {
        title: title,
        subtitle: pathname,
        media: media
      };
    }
  }
});

export default artwork;
export type { IArtwork };
