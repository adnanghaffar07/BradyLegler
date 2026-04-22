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
  "slug": slug.current,
  pathname
}`;

const docs = await client.fetch(query);

console.log(`Found ${docs.length} artwork documents`);

for (const doc of docs) {
  if (!doc.slug) continue;

  const cleanedSlug = doc.slug !== "/"
    ? doc.slug.replace(/\/+$/, "")
    : doc.slug;

  const cleanedPath = doc.pathname
    ? doc.pathname.replace(/\/+$/, "")
    : undefined;

  // skip if nothing changes
  if (
    cleanedSlug === doc.slug &&
    cleanedPath === doc.pathname
  ) continue;

  await client
    .patch(doc._id)
    .set({
      "slug.current": cleanedSlug,
      ...(cleanedPath && { pathname: cleanedPath }),
    })
    .commit();

  console.log(
    `Updated: ${doc.slug} → ${cleanedSlug} | ${doc.pathname} → ${cleanedPath}`
  );
}

console.log("Done 🎉");