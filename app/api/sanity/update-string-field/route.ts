import { NextApiRequest, NextApiResponse } from 'next';
import { createClient, SanityDocument } from '@sanity/client';

interface RequestBody {
  documentId: string;
  fieldName: string;
  newValue: any; // You might want to specify a more specific type for the newValue
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_WRITE_TOKEN // Only if you want to update content with the client
});

export const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  const body = await req.json();
  const { documentId, fieldName, newValue }: RequestBody = body;

  if (!documentId || !fieldName || !newValue) {
    const response = JSON.stringify({
      error: 'Bad Request',
      message: 'Please provide documentId, fieldName, and newValue'
    });
    return new Response(response, {
      status: 400
    });
  }

  try {
    await client
      .patch(documentId)
      .set({
        [fieldName]: newValue
      })
      .commit();

    const response = JSON.stringify({
      message: `String field '${fieldName}' in document '${documentId}' updated successfully.`
    });
    return new Response(response, {
      status: 200
    });
  } catch (error) {
    const response = JSON.stringify({ error: 'Internal Server Error', message: error.message });
    return new Response(response, {
      status: 500
    });
  }
};
