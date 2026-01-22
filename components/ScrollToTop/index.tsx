'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ScrollToTop component ensures the page scrolls to the top
 * when navigating to a new route in Next.js App Router
 */
export default function ScrollToTop() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Scroll to top when pathname changes (new page navigation)
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Use 'instant' for immediate scroll, or 'smooth' for animated
    });
  }, [pathname]); // Only trigger on pathname change, not searchParams

  return null;
}
