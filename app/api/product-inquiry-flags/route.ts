import { getProductInquiryFlags } from '@/tools/sanity/helpers/getProductInquiryFlags';

export async function POST(request: Request) {
  try {
    const { handles } = await request.json();

    if (!Array.isArray(handles) || handles.length === 0) {
      return Response.json({}, { status: 400 });
    }

    const flags = await getProductInquiryFlags(handles);
    return Response.json(flags);
  } catch (error) {
    console.error('Error fetching product inquiry flags:', error);
    return Response.json({}, { status: 500 });
  }
}
