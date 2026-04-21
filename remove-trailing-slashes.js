import { createClient } from "@sanity/client";
import dotenv from "dotenv";

dotenv.config();

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_WRITE_TOKEN,
  apiVersion: "2024-01-01",
  useCdn: false,
});



// fetch all artwork docs with slugs
const query = `*[_type == "artwork" && defined(slug.current)]{
  _id,
  "slug": slug.current
}`;

const docs = await client.fetch(query);

console.log(`Found ${docs.length} artwork documents`);

for (const doc of docs) {
  if (!doc.slug) continue;

  // remove trailing slash ONLY
  const cleaned = doc.slug.replace(/\/+$/, "");

  // skip if nothing changes
  if (cleaned === doc.slug) continue;

  await client
    .patch(doc._id)
    .set({
      "slug.current": cleaned,
    })
    .commit();

  console.log(`Updated: ${doc.slug} → ${cleaned}`);
}

console.log("Done 🎉");