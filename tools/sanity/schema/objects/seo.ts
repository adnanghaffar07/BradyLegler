import { defineType } from 'sanity';

interface ISeoObject {
  seoTitle?: string;
  seoDescription?: string;
  openGraphImage?: {
    asset: {
      url: string;
    };
  };
  canonicalUrl?: string;
  jsonLd?: string;
  noIndex: boolean;
}

const seo = defineType({
  name: 'seo',
  title: 'Seo',
  type: 'object',
  fields: [
    {
      name: `seoTitle`,
      title: `SEO Title`,
      type: `string`,
      description: 'This will change your page meta title in browsers. Ideal length is 50-60 characters.',
      validation: Rule => Rule.max(60).warning('Shorter titles are usually better for SEO.')
    },
    {
      name: `seoDescription`,
      title: `SEO Description`,
      description: 'This will change your page description in browsers. Ideal length is 50-160 characters.',
      type: `string`,
      validation: Rule => Rule.max(160).warning('Shorter descriptions are usually better for SEO.')
    },
    {
      name: `openGraphImage`,
      title: `Open Graph Image`,
      description:
        'The thumbnail displayed on social networks (such as Facebook & LinkedIn) to preview your webpage whenever someone shares this page link. Recommended 1200 x 630px.',
      type: `image`
    },
    {
      name: `canonicalUrl`,
      title: `Canonical URL`,
      description: `The canonical URL for this page. If left blank, the page's URL will be used.`,
      type: `url`
    },
    {
      name: `jsonLd`,
      title: `Custom JSON-LD`,
      description: `Paste valid JSON-LD schema for this page/document. Example: { "@context": "https://schema.org", "@type": "WebPage", ... }`,
      type: `text`,
      options: {
        rows: 10
      },
      validation: Rule =>
        Rule.custom((value: string) => {
          if (!value) return true;
          try {
            JSON.parse(value);
            return true;
          } catch (error) {
            return 'Invalid JSON-LD JSON format';
          }
        })
    },
    {
      name: `noIndex`,
      title: `No-Index (Block search engine indexing)`,
      type: `boolean`,
      initialValue: false
    }
  ]
});

export default seo;
export type { ISeoObject };
