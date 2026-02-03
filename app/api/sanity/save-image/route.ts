// pages/api/uploadImage.ts

import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  useCdn: true, // set to `false` to bypass the edge cache
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  token: process.env.SANITY_WRITE_TOKEN // Only if you want to update content with the client
});

interface RequestBody {
  imageUrl: string;
  documentRef: string;
  fieldName: string;
  fileName: string;
}

export const POST = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const body = await req.json();
    const { imageUrl, documentRef, fieldName, fileName }: RequestBody = body;

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);

    const blob = await imageRes.blob();

    // Convert blob to a Buffer
    const buffer: ArrayBuffer = await blob.arrayBuffer();
    const file: Buffer = Buffer.from(buffer);

    // Upload the image to Sanity
    const imageAsset = await client.assets.upload('image', file, {
      filename: fileName || `uploaded_image.jpg`,
      contentType: blob.type
    });

    const draftsQuery = `*[_id == "drafts.${documentRef}"]`;

    let documentId = documentRef;

    const drafts = await client.fetch(draftsQuery);

    if (drafts.length > 0) {
      documentId = `drafts.${documentRef}`;
    }

    // Update the document with the image asset reference
    // Use a transaction to first unset the existing reference and then set the new one
    await client
      .patch(documentId)
      .set({
        [fieldName]: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: imageAsset._id
          }
        }
      })
      .commit({ autoGenerateArrayKeys: true });

    const response = JSON.stringify({ message: 'Image uploaded successfully', imageAsset });

    return new Response(response);
  } catch (error) {
    return new Response(`Error uploading image: ${error.message}`, {
      status: 500
    });
  }
};
