import { defineType } from 'sanity';

interface IHowToMeasureSection {
  _key?: string;
  title: string;
  steps: string[];
}

const howToMeasureSection = defineType({
  name: 'howToMeasureSection',
  title: 'How to Measure Section',
  type: 'object',
  fields: [
    {
      name: 'title',
      title: 'Section Title',
      type: 'string'
    },
    {
      name: 'steps',
      title: 'Steps',
      description: 'Each item is rendered as one numbered step.',
      type: 'array',
      of: [{ type: 'string' }]
    }
  ],
  preview: {
    select: {
      title: 'title',
      steps: 'steps'
    },
    prepare: selection => ({
      title: selection.title || 'How to Measure Section',
      subtitle: selection.steps?.length ? `${selection.steps.length} step(s)` : undefined
    })
  }
});

export default howToMeasureSection;
export type { IHowToMeasureSection };
