import slugify from 'slugify';
import { TbFileText, TbSearch, TbDatabase } from 'react-icons/tb';
import { defineType } from 'sanity';
import { SectionLibrary } from '../../components/SectionLibrary';
import { ISeoObject } from '../objects/seo';

interface IPress {
  // Sanity fields
  _id: string;
  _createdAt: string;
  _updatedAt: string;

  // Defined fields
  title: string;
  subtitle: string;
  content: SanityTextBlock[];
  slug: {
    current: string;
  };
  pathname: string;
  publishDate: string;
  featureImage: SanityImage;
  sections: any[];
  seoData: ISeoObject;
}

const press = defineType({
  name: `press`,
  title: `Press`,
  type: `document`,
  icon: TbFileText,
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
      icon: TbFileText
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
      description: 'The press page title.',
      type: 'string',
      group: 'data',
      validation: Rule => Rule.required()
    },
    {
      name: 'subtitle',
      title: 'Subtitle',
      description: 'A subtitle or tagline for the press page',
      type: 'string',
      group: 'data'
    },
    {
      name: `slug`,
      title: `Slug`,
      description:
        '/press will be automatically added to the back of the url. Please ensure forward slash / is added to beginning and end of the slug e.g. /example-post/',
      type: `slugElement`,
      options: {
        source: 'title',
        slugify: (input: string) => `/${slugify(input, { lower: true, strict: true })}/`,
        prefix: '/press'
      },
      group: 'data'
    },
    {
      name: `content`,
      title: `Description`,
      description: `The press page description`,
      type: `blockContentSimple`,
      group: 'content'
    },
    {
      name: `publishDate`,
      title: `Publish Date`,
      type: `datetime`,
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
        { type: 'twoColMediaSection' },
        { type: 'twoColTextSection' },
        { type: `videoSection` },
        { type: 'imageCenteredSection' },
        { type: 'fullscreenImageSection' },
        { type: `linksSection` },
        { type: `announcementSection` },
        { type: 'discoverMoreSection' },
        { type: 'productsSection' },
        { type: 'spacerSection' }
      ],
      components: { input: SectionLibrary },
      group: 'content'
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
      subtitle: `subtitle`,
      pathname: `pathname`,
      media: `featureImage.image`
    },
    prepare(selection) {
      const { title, subtitle, pathname, media } = selection;
      return {
        title: title,
        subtitle: subtitle || pathname,
        media: media
      };
    }
  }
});

export default press;
export type { IPress };
