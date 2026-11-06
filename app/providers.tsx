'use client';

import React, { Suspense } from 'react';
import { ContactSidebarProvider } from '@/tools/hooks/useContactSidebar';
import { MetaPixelProvider } from '@/components/providers/MetaPixelProvider';
import EmailSubscriptionPopup from '@/components/EmailSubscriptionPopup';
import KlaviyoTracker from '@/components/KlaviyoTracker';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MetaPixelProvider>
      <ContactSidebarProvider>
        <Suspense fallback={null}>
          <KlaviyoTracker />
        </Suspense>
        {children}
        <EmailSubscriptionPopup />
      </ContactSidebarProvider>
    </MetaPixelProvider>
  );
};
