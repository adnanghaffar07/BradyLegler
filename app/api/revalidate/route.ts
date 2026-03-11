import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type Payload = {
  slug: {
    current: string;
  };
  store: {
    slug: {
      current: string;
    };
  };
  _type: string;
};

export const POST = async (req: NextRequest) => {
  try {
    const data: Payload = await req.json();

    const type = data?._type;
    const slug = data?.slug?.current || data?.store?.slug?.current;

    const revalidatedPaths: string[] = [];
    const revalidatedTags: string[] = [];

    switch (type) {
      case 'page':
        revalidatePath(slug);
        revalidatedPaths.push(slug);
        break;
      case 'article':
        revalidatePath(slug);
        revalidatePath(`/articles`);
        revalidatedPaths.push(slug, '/articles');
        break;
      case 'artwork':
        revalidatePath(slug);
        revalidatePath(`/gallery/`);
        revalidatePath(`/gallery/archive/`);
        revalidatedPaths.push(slug, '/gallery/', '/gallery/archive/');
        break;
      case 'product':
        if (slug) {
          revalidatePath(`/${slug}/`);
          revalidatedPaths.push(slug);
        }
        revalidateTag('headerProductSlugs');
        revalidatedTags.push('headerProductSlugs');
        break;
      case 'collection':
        if (slug) {
          revalidatePath(`/${slug}/`);
          revalidatedPaths.push(slug);
        }
        revalidateTag('headerCollectionSlugs');
        revalidatedTags.push('headerCollectionSlugs');
        break;
      case 'footerDocument':
        revalidateTag('footerDocument');
        revalidatePath('/', 'layout');
        revalidatedTags.push('footerDocument');
        revalidatedPaths.push('/ (layout)');
        break;
      case 'headerDocument':
        revalidateTag('headerDocument');
        revalidatePath('/', 'layout');
        revalidatedTags.push('headerDocument');
        revalidatedPaths.push('/ (layout)');
        break;
      case 'socialMediaDocument':
        revalidateTag('socialMediaDocument');
        revalidatePath('/', 'layout');
        revalidatedTags.push('socialMediaDocument');
        revalidatedPaths.push('/ (layout)');
        break;
      case 'sizeGuideDocument':
        revalidateTag('sizeGuideDocument');
        revalidatePath('/', 'layout');
        revalidatedTags.push('sizeGuideDocument');
        revalidatedPaths.push('/ (layout)');
        break;
      default:
        revalidatePath('/', 'layout');
        revalidatedPaths.push('/ (layout - fallback)');
        break;
    }

    return NextResponse.json({
      revalidated: true,
      details: {
        type,
        slug,
        revalidatedPaths,
        revalidatedTags,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      revalidated: false,
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
};
