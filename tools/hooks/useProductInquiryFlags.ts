import { useEffect, useState } from 'react';

type ProductInquiryFlag = {
  handle: string;
  inquireButtonEnabled?: boolean;
  inquireButtonLabel?: string;
};

/**
 * Hook to fetch product inquiry flags from Sanity (client-side)
 * Fetches the inquireButtonEnabled flag for multiple products by their handles
 */
export function useProductInquiryFlags(handles: string[]) {
  const [flags, setFlags] = useState<Record<string, ProductInquiryFlag>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!handles || handles.length === 0) {
      setFlags({});
      return;
    }

    const fetchFlags = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/product-inquiry-flags', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ handles })
        });

        if (response.ok) {
          const data = await response.json();
          setFlags(data);
        }
      } catch (error) {
        console.error('Failed to fetch product inquiry flags:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [handles]);

  return { flags, loading };
}
