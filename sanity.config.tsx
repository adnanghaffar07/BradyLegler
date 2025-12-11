import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';
import { visionTool } from '@sanity/vision';
import { colorInput } from '@sanity/color-input';
import { presentationTool } from 'sanity/presentation';
import { table } from '@sanity/table';
import { IconManager } from 'sanity-plugin-icon-manager';
import path from 'path';

import schemas from './tools/sanity/schema';
import theme from './tools/sanity/config/theme';
import PreviewAction from './tools/sanity/actions/PreviewAction';
import structure from './tools/sanity/structure';
import { customDocumentActions } from './tools/sanity/plugins/customDocumentActions';

export default defineConfig({
  title: "Brady Legler",
  projectId: "79j3g10q",
  dataset: "production",
  name: 'default',
  basePath: '/studio',
  theme,
  icon: '👗', // <- JSX removed for TS compatibility
  schema: {
    types: schemas
  },
  document: {
    actions: [PreviewAction]
  },
  plugins: [
    structureTool({ structure }),
    customDocumentActions(),
    colorInput(),
    visionTool(),
    media(),
    table(),
    IconManager({
      availableCollections: ['tabler'],
      inlineSvg: true
    }),
    presentationTool({
      name: 'visual-editor',
      title: 'Visual Editor',
      previewUrl: { draftMode: { enable: '/api/draft' } }
    })
  ],
  vite: (config:any) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname)
    };
    return config;
  }
});
