import { FaSistrix } from 'react-icons/fa';
import { FiDatabase } from 'react-icons/fi';
import { SectionLibrary } from '../../components/SectionLibrary';
import { defineType } from 'sanity';
import { TbFile } from 'react-icons/tb';
import { ISeoObject } from '../objects/seo';

interface IPageDocument {
  // Sanity fields
  _createdAt: string;
  _updatedAt: string;

  // Defined fields
  title: string;
  slug: {
    current: string;
  };
  pathname: string;
  breadcrumbs: {
    slug: {
      current: string;
    };
    pathname: string;
    title: string;
  }[];
  sections: any[];
  seoData: ISeoObject;
}

const page = defineType({
  name: `page`,
  title: `Page`,
  type: `document`,
  icon: TbFile,
  groups: [
    {
      name: 'data',
      title: 'Data',
      default: true,
      icon: FiDatabase
    },
    {
      name: 'seo',
      title: 'SEO',
      icon: FaSistrix
    }
  ],
  fields: [
    {
      name: `title`,
      title: `Title`,
      type: `string`,
      group: 'data'
    },
    {
      name: `slug`,
      title: `Slug`,
      type: `slugElement`,
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
    // {
    //   name: `breadcrumbs`,
    //   title: `Breadcrumbs`,
    //   description: `Breadcrumbs are displayed as 'Home > Current Page' by default. If you want to add paths in between 'Home' and 'Current Path' add them below:`,
    //   type: `array`,
    //   group: 'data',
    //   of: [
    //     {
    //       type: 'reference',
    //       to: [{ type: 'page' }, { type: 'artwork' }]
    //     }
    //   ]
    // },
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
        { type: `listArtwork` },
        { type: `announcementSection` },
        { type: 'discoverMoreSection' },
        { type: 'homeCollections' },
        { type: 'productsSection' },
        { type: 'spacerSection' }
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
      title: 'title',
      slug: 'slug.current'
    },
    prepare(selection) {
      const { title, slug } = selection;
      return {
        title: title,
        subtitle: slug
      };
    }
  }
});

export default page;
export type { IPageDocument };
