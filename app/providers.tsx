'use client';

import React from 'react';
import { ContactSidebarProvider } from '@/tools/hooks/useContactSidebar';
import { MetaPixelProvider } from '@/components/providers/MetaPixelProvider';
import EmailSubscriptionPopup from '@/components/EmailSubscriptionPopup';

export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MetaPixelProvider>
      <ContactSidebarProvider>
        {children}
        <EmailSubscriptionPopup />
      </ContactSidebarProvider>
    </MetaPixelProvider>
  );
};
