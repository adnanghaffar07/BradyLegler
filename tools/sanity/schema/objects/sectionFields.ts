import { defineType } from 'sanity';

const sectionFields = defineType({
  name: 'sectionFields',
  title: 'Section Fields',
  type: 'object',
  fields: []
  // Spacing options removed
  // {
  //   name: 'spacingOptions',
  //   title: 'Spacing Options',
  //   type: 'spacingOptions'
  // }
  // {
  //   name: 'themeOptions',
  //   title: 'Theme Options',
  //   type: 'themeOptions'
  // }
});

// Section fields for both middle and bottom sections
// When used in sectionsMiddle: shows gridPosition
// Spacing options removed entirely
const sectionFieldsMiddle = defineType({
  name: 'sectionFieldsMiddle',
  title: 'Section Fields',
  type: 'object',
  fields: [
    {
      name: 'gridPosition',
      title: 'Grid Position',
      description: 'Position within the product grid. Top: 25% of products, Middle: 50% of products, Bottom: 75% of products',
      type: 'string',
      options: {
        list: [
          { title: 'Top (25% of products)', value: 'top' },
          { title: 'Middle (50% of products)', value: 'middle' },
          { title: 'Bottom (75% of products)', value: 'bottom' }
        ],
        layout: 'radio',
        direction: 'horizontal'
      },
      initialValue: 'middle'
    }
  ]
});

// Spacing options removed from schema
// const spacingOptions = defineType({
//   name: 'spacingOptions',
//   title: 'Spacing Options',
//   type: 'object',
//   initialValue: {
//     removeTopSpacing: false,
//     removeBottomSpacing: false
//   },
//   options: {
//     collapsed: false
//   },
//   fields: [
//     {
//       name: 'removeTopSpacing',
//       title: 'Remove Top Spacing',
//       type: 'boolean'
//     },
//     {
//       name: 'removeBottomSpacing',
//       title: 'Remove Bottom Spacing',
//       type: 'boolean'
//     }
//   ]
// });

// try to use me for most if you need a one-off section specific theme define it in the section
// const themeOptions = defineType({
//   name: 'themeOptions',
//   title: 'Theme Options',
//   type: 'object',
//   fields: [
//     {
//       name: 'theme',
//       title: 'Theme',
//       type: 'string',
//       options: {
//         list: [
//           { value: 'light', title: 'Light' },
//           { value: 'dark', title: 'Dark' }
//         ],
//         layout: 'radio',
//         direction: 'horizontal'
//       }
//     }
//   ]
// });

export { sectionFieldsMiddle };
