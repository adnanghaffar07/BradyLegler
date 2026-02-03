import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION
});

const fetchSanityRedirects = async () => {
  try {
    const query = `*[_type == "settings" && _id == "settings"][0].redirectsArr`;
    const sanityRawRedirects = await client.fetch(query);
    if (!sanityRawRedirects) {
      return [];
    }
    return sanityRawRedirects.reduce((accumulator, redirect) => {
      const { source, destination, permanent } = redirect;
      if (!source || !destination) {
        return accumulator;
      }
      accumulator.push({
        source,
        destination,
        permanent
      });
      return accumulator;
    }, []);
  } catch (error) {
    return [];
  }
};

export default fetchSanityRedirects;
