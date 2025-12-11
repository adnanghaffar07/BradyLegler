import { createClient } from 'next-sanity';

export const client = createClient({
  apiVersion: "2021-03-25",
  dataset: "production",
  projectId: "79j3g10q",
  useCdn: true,
  // These settings will be overridden in
  // ./sanity/lib/store.ts when draftMode is enabled
  perspective: 'published',
  stega: {
    enabled: false,
    studioUrl: '/studio'
  }
});
