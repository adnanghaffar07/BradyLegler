import { defineType } from 'sanity';
import { IHowToMeasureSection } from '../objects/howToMeasureSection';

interface ISizeGuideDocument {
  _id: string;
  _updatedAt: string;
  tables: {
    title: string;
    collections: {
      _ref: string;
      _type: string;
      store?: {
        gid: string;
        v;
      };
    }[];
    Table: {
      rows: {
        _key: string;
        cells: string[];
      }[];
    };
  };
  howToMeasure: IHowToMeasureSection[];
}

const sizeGuideDocument = defineType({
  name: `sizeGuideDocument`,
  title: `Size Guide`,
  type: `document`,
  fields: [
    {
      name: 'tables',
      title: 'Tables',
      type: 'array',
      of: [{ type: 'sizeGuideTable' }]
    },
    {
      name: 'howToMeasure',
      title: 'How to Measure',
      description: 'Sections shown under the "How to Measure" tab of the size guide.',
      type: 'array',
      of: [{ type: 'howToMeasureSection' }]
    }
  ],
  preview: {
    prepare() {
      return {
        title: `Size Guide`
      };
    }
  }
});

export default sizeGuideDocument;
export type { ISizeGuideDocument };
