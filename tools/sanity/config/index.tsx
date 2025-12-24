import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { media } from 'sanity-plugin-media';
import { visionTool } from '@sanity/vision';
import { colorInput } from '@sanity/color-input';
import { presentationTool } from 'sanity/presentation';
import { table } from '@sanity/table';
import { IconManager } from 'sanity-plugin-icon-manager';
import schemas from '../schema';
import theme from './theme';
import PreviewAction from '../actions/PreviewAction';
import structure from '../structure';
import { customDocumentActions } from '../plugins/customDocumentActions';

const SANITY_STUDIO_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const SANITY_STUDIO_PROJECT_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const SANITY_STUDIO_PROJECT_NAME = process.env.NEXT_PUBLIC_SANITY_PROJECT_NAME;

export default defineConfig({
  title: SANITY_STUDIO_PROJECT_NAME,
  projectId: SANITY_STUDIO_PROJECT_ID || '',
  dataset: SANITY_STUDIO_PROJECT_DATASET || '',
      apiVersion: "2021-03-25",
  name: 'default',
  basePath: '/studio',
  theme,
  icon: () => <div style={{ fontSize: '25px', lineHeight: 1, width: '100%', height: '100%' }}>👗</div>,
  schema: {
    types: schemas
  },
  document: {
    actions: [PreviewAction]
  },
  scheduledPublishing: {
    enabled: false
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
      // locate,
      name: 'visual-editor',
      title: 'Visual Editor',
      previewUrl: {
        draftMode: {
          enable: '/api/draft'
        }
      }
    })
    // googleMapsInput({
    //   apiKey: GATSBY_GOOGLE_MAPS_API_KEY,
    // }),
  ]
});
