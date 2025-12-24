import { createClient } from '@sanity/client';

const client = createClient({
  projectId: "79j3g10q",
  dataset: "production",
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: "2024-01-01"
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
    console.log('An error occurred while fetching Sanity redirects: ', error);
    return [];
  }
};

export default fetchSanityRedirects;
